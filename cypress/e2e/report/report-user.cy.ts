const TARGET_MEMBER_ID = 87;

const targetProfile = {
  userId: TARGET_MEMBER_ID,
  nickname: "커피홀릭",
  gender: "FEMALE",
  age: 27,
  profileImageUrl: "/assets/avatar/f3.png",
  interests: [],
};

type ReportPayload = {
  reportedMemberId: number;
  reason: string;
  source: string;
  detail?: string;
  imageKeys: string[];
  block: boolean;
};

type UploadUrlsPayload = {
  files: { contentType: string; contentLength: number }[];
};

let lastReport: ReportPayload | null = null;
let lastUploadRequest: UploadUrlsPayload | null = null;
let s3PutCount = 0;

/** BE 계약(PR #97): 검증/비즈니스 오류는 HTTP 200 + success:false 로 내려온다. */
function businessError(code: string, message: string, statusCode = 409) {
  return {
    statusCode: 200,
    body: { success: false, data: null, error: { statusCode, code, message } },
  };
}

function mockReportApi(options: { failWith?: { code: string; message: string } } = {}) {
  lastReport = null;
  lastUploadRequest = null;
  s3PutCount = 0;

  cy.intercept("GET", "**/api/**/users/*/profile", {
    success: true,
    data: targetProfile,
  }).as("getTargetProfile");

  cy.intercept("POST", "**/api/**/user-reports/image-upload-urls", (req) => {
    lastUploadRequest = req.body as UploadUrlsPayload;
    req.reply({
      success: true,
      data: {
        uploads: lastUploadRequest.files.map((_, index) => ({
          objectKey: `pending/user-reports/1/key-${index}`,
          uploadUrl: `http://localhost:3100/mock-s3/${index}`,
        })),
      },
    });
  }).as("issueUploadUrls");

  cy.intercept("PUT", "**/mock-s3/*", (req) => {
    s3PutCount += 1;
    req.reply({ statusCode: 200, body: "" });
  }).as("s3Put");

  // /user-reports 로 정확히 끝나는 요청만(= image-upload-urls 제외) 접수로 본다.
  cy.intercept("POST", /\/user-reports$/, (req) => {
    lastReport = req.body as ReportPayload;
    if (options.failWith) {
      req.reply(businessError(options.failWith.code, options.failWith.message));
      return;
    }
    req.reply({ success: true, data: { id: 321 } });
  }).as("createReport");
}

describe("report a user", () => {
  beforeEach(() => {
    cy.clockPeriod("CHATTING");
    cy.mockApi();
    cy.login();
  });

  it("submits a report and shows the completion screen", () => {
    mockReportApi();
    cy.visit(`/report?userId=${TARGET_MEMBER_ID}`);
    cy.wait("@getTargetProfile");

    cy.contains("신고하기").should("be.visible");
    cy.contains("커피홀릭").should("be.visible");

    cy.contains("button", "신고하기").should("be.disabled");
    cy.contains("부적절한 행동").click();
    cy.contains("button", "신고하기").should("not.be.disabled");

    cy.get("#report-detail").type("대화 중에 불쾌한 발언을 반복했어요.");
    cy.contains("20/500").should("be.visible");
    cy.contains("이 사용자 차단하기").click();

    cy.contains("button", "신고하기").click();
    cy.wait("@createReport");

    cy.contains("신고가 접수됐어요").should("be.visible");
    cy.contains("차단이 적용됐어요").should("be.visible");

    cy.then(() => {
      // BE 계약: reason/source는 kebab code, imageKeys는 비어 있어도 배열로 보낸다.
      // block은 필수 필드이며, 체크박스를 켜면 접수와 동시에 서버가 차단까지 처리한다.
      expect(lastReport).to.deep.equal({
        reportedMemberId: TARGET_MEMBER_ID,
        reason: "inappropriate-behavior",
        source: "profile",
        detail: "대화 중에 불쾌한 발언을 반복했어요.",
        imageKeys: [],
        block: true,
      });
    });
  });

  it("uploads evidence via presigned URLs before creating the report", () => {
    mockReportApi();
    cy.visit(`/report?userId=${TARGET_MEMBER_ID}`);
    cy.wait("@getTargetProfile");

    cy.contains("허위 정보").click();
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("fake-png-bytes"),
        fileName: "evidence.png",
        mimeType: "image/png",
      },
      { force: true },
    );
    cy.contains("1/3").should("be.visible");

    cy.contains("button", "신고하기").click();
    cy.wait("@issueUploadUrls");
    cy.wait("@s3Put");
    cy.wait("@createReport");

    cy.contains("신고가 접수됐어요").should("be.visible");

    cy.then(() => {
      expect(lastUploadRequest?.files[0].contentType).to.equal("image/png");
      expect(lastUploadRequest?.files[0].contentLength).to.be.greaterThan(0);
      expect(s3PutCount).to.equal(1);
      expect(lastReport?.imageKeys).to.deep.equal(["pending/user-reports/1/key-0"]);
    });
  });

  it("requires detail when 기타 is selected (BE 6003)", () => {
    mockReportApi();
    cy.visit(`/report?userId=${TARGET_MEMBER_ID}`);
    cy.wait("@getTargetProfile");

    cy.contains("기타").click();
    cy.contains("상세 설명 (필수)").should("be.visible");
    cy.contains("button", "신고하기").should("be.disabled");

    cy.get("#report-detail").type("직접 입력한 사유입니다.");
    cy.contains("button", "신고하기").should("not.be.disabled").click();
    cy.wait("@createReport");
    cy.contains("신고가 접수됐어요").should("be.visible");
  });

  it("shows a toast for a duplicate report (HTTP 200 + success:false, code 6002)", () => {
    mockReportApi({ failWith: { code: "6002", message: "이미 신고한 사용자입니다." } });
    cy.visit(`/report?userId=${TARGET_MEMBER_ID}`);
    cy.wait("@getTargetProfile");

    cy.contains("미성년자").click();
    cy.contains("button", "신고하기").click();
    cy.wait("@createReport");

    cy.contains("이미 신고한 사용자입니다.").should("be.visible");
    cy.contains("신고가 접수됐어요").should("not.exist");
  });

  it("shows a toast when reporting yourself (code 6001)", () => {
    mockReportApi({ failWith: { code: "6001", message: "자기 자신은 신고할 수 없습니다." } });
    cy.visit(`/report?userId=${TARGET_MEMBER_ID}`);
    cy.wait("@getTargetProfile");

    cy.contains("금전 요구").click();
    cy.contains("button", "신고하기").click();
    cy.wait("@createReport");

    cy.contains("본인은 신고할 수 없어요.").should("be.visible");
  });

  it("hides the block notice when 차단하기 is not checked", () => {
    mockReportApi();
    cy.visit(`/report?userId=${TARGET_MEMBER_ID}`);
    cy.wait("@getTargetProfile");

    cy.contains("금전 요구").click();
    cy.contains("button", "신고하기").click();
    cy.wait("@createReport");

    cy.contains("신고가 접수됐어요").should("be.visible");
    cy.contains("차단이 적용됐어요").should("not.exist");

    cy.then(() => {
      expect(lastReport?.block).to.equal(false);
    });
  });

  it("opens from the 1:1 chat menu and reports source=chat-room", () => {
    mockReportApi();
    // roomId는 int64다.
    cy.visit("/chat/one-on-one/1");

    cy.get('img[alt="더보기"]', { timeout: 8000 }).parent("button").click();
    cy.contains("신고하기").click();

    cy.location("pathname").should("match", /^\/report\/?$/);
    cy.location("search").should("include", "source=chat-room");
    cy.contains("신고 사유 선택").should("be.visible");

    cy.contains("부적절한 행동").click();
    cy.contains("button", "신고하기").click();
    cy.wait("@createReport");

    cy.then(() => {
      expect(lastReport?.source).to.equal("chat-room");
    });
  });
});
