/**
 * 설정 > 정보 > 의견 보내기. 계약 정본은 BE 위키 `Frontend-Feedback-Guide` 다.
 * 스크린샷이 있으면 발급 → S3 PUT → 접수, 없으면 접수만 부른다.
 */

type FeedbackPayload = {
  type: string;
  content: string;
  appVersion?: string;
  os?: string;
  deviceModel?: string;
  imageKeys: string[];
};

type FeedbackUploadUrlsPayload = {
  files: { contentType: string; contentLength: number }[];
};

let lastFeedback: FeedbackPayload | null = null;
let feedbackCount = 0;
let lastFeedbackUploadRequest: FeedbackUploadUrlsPayload | null = null;
let feedbackS3PutCount = 0;

/** BE 계약: 검증/비즈니스 오류는 HTTP 200 + success:false 로 내려온다. */
function feedbackBusinessError(code: string, message: string, statusCode = 400) {
  return {
    statusCode: 200,
    body: { success: false, data: null, error: { statusCode, code, message } },
  };
}

function mockFeedbackApi(options: { failWith?: { code: string; message: string } } = {}) {
  lastFeedback = null;
  feedbackCount = 0;
  lastFeedbackUploadRequest = null;
  feedbackS3PutCount = 0;

  cy.intercept("GET", "**/api/**/users/me", {
    success: true,
    data: { email: "test@email.com", gender: "MALE" },
  });
  cy.intercept("GET", "**/api/**/users/me/notification-settings", {
    success: true,
    data: { matching: true, chat: true, marketing: false },
  });

  cy.intercept("POST", "**/api/**/feedbacks/image-upload-urls", (req) => {
    lastFeedbackUploadRequest = req.body as FeedbackUploadUrlsPayload;
    req.reply({
      success: true,
      data: {
        uploads: lastFeedbackUploadRequest.files.map((_, index) => ({
          objectKey: `pending/feedbacks/1/key-${index}`,
          uploadUrl: `http://localhost:3100/mock-s3/${index}`,
        })),
      },
    });
  }).as("issueUploadUrls");

  cy.intercept("PUT", "**/mock-s3/*", (req) => {
    feedbackS3PutCount += 1;
    req.reply({ statusCode: 200, body: "" });
  }).as("s3Put");

  // /feedbacks 로 정확히 끝나는 요청만(= image-upload-urls 제외) 접수로 본다.
  cy.intercept("POST", /\/feedbacks$/, (req) => {
    lastFeedback = req.body as FeedbackPayload;
    feedbackCount += 1;
    if (options.failWith) {
      req.reply(feedbackBusinessError(options.failWith.code, options.failWith.message));
      return;
    }
    req.reply({ success: true, data: { id: 51 } });
  }).as("createFeedback");
}

describe("send feedback", () => {
  beforeEach(() => {
    cy.mockApi();
    cy.login();
  });

  it("opens from settings and sends a bug report without screenshots", () => {
    mockFeedbackApi();
    cy.visit("/settings");
    cy.contains("button", "의견 보내기").click();
    cy.location("pathname").should("match", /^\/settings\/feedback\/?$/);

    // 답변을 기다리게 하는 문구가 아니라 "참고할게요"로 안내한다.
    cy.contains("보내 주신 의견은 서비스 개선에 참고할게요.").should("be.visible");

    // 유형과 내용이 모두 있어야 보낼 수 있다.
    cy.contains("button", "보내기").should("be.disabled");
    cy.contains("버그 제보").click();
    cy.get('input[aria-label="버그 제보"]').should("be.checked");
    cy.contains("button", "보내기").should("be.disabled");
    // 공백만 있는 내용은 보내지 않는다(BE 0001).
    cy.get("#feedback-content").type("   ").blur();
    cy.contains("button", "보내기").should("be.disabled");

    cy.get("#feedback-content").clear().type("  채팅방에서 사진을 보내면 회색 화면만 보여요.  ").blur();
    cy.contains("/1000").should("be.visible");
    // 유형은 하나만 고른다.
    cy.contains("개선 제안").click();
    cy.get('input[aria-label="버그 제보"]').should("not.be.checked");
    cy.contains("버그 제보").click();

    cy.contains("button", "보내기").should("not.be.disabled").click();
    cy.wait("@createFeedback");

    cy.contains("의견을 보냈어요").should("be.visible");
    cy.then(() => {
      // 스크린샷이 없으면 발급·업로드 없이 접수만 하고, imageKeys 는 null 이 아니라 [] 다.
      expect(lastFeedbackUploadRequest).to.equal(null);
      expect(lastFeedback?.type).to.equal("bug");
      expect(lastFeedback?.content).to.equal("채팅방에서 사진을 보내면 회색 화면만 보여요.");
      expect(lastFeedback?.imageKeys).to.deep.equal([]);
      // 웹에는 앱 셸이 없어 셸 버전을 싣지 않는다. OS 는 UA 에서 읽는다.
      expect(lastFeedback).not.to.have.property("appVersion");
      expect(lastFeedback?.os).to.be.a("string").and.have.length.greaterThan(0);
    });

    cy.contains("button", "확인").click();
    cy.location("pathname").should("match", /^\/settings\/?$/);
  });

  it("uploads screenshots via presigned URLs before sending", () => {
    mockFeedbackApi();
    cy.visit("/settings/feedback");

    cy.contains("개선 제안").click();
    cy.get("#feedback-content").type("매칭 결과를 지난주 것까지 다시 볼 수 있으면 좋겠어요.").blur();
    cy.get('input[type="file"]').selectFile(
      [
        { contents: Cypress.Buffer.from("fake-png-1"), fileName: "one.png", mimeType: "image/png" },
        { contents: Cypress.Buffer.from("fake-jpeg-22"), fileName: "two.jpg", mimeType: "image/jpeg" },
      ],
      { force: true },
    );
    cy.contains("2/3").should("be.visible");
    cy.get('img[alt="첨부한 스크린샷"]').should("have.length", 2);

    cy.contains("button", "보내기").click();
    cy.wait("@issueUploadUrls");
    cy.wait("@createFeedback");

    cy.contains("의견을 보냈어요").should("be.visible");
    cy.then(() => {
      expect(lastFeedbackUploadRequest?.files).to.deep.equal([
        { contentType: "image/png", contentLength: 10 },
        { contentType: "image/jpeg", contentLength: 12 },
      ]);
      expect(feedbackS3PutCount).to.equal(2);
      expect(lastFeedback?.type).to.equal("suggestion");
      expect(lastFeedback?.imageKeys).to.deep.equal([
        "pending/feedbacks/1/key-0",
        "pending/feedbacks/1/key-1",
      ]);
    });
  });

  it("stays on the form and explains when the server rejects the input (0001)", () => {
    mockFeedbackApi({ failWith: { code: "0001", message: "요청 값이 올바르지 않습니다." } });
    cy.visit("/settings/feedback");

    cy.contains("기타").click();
    cy.get("#feedback-content").type("감사합니다").blur();
    cy.contains("button", "보내기").click();
    cy.wait("@createFeedback");

    cy.contains("입력 내용을 다시 확인해 주세요.").should("be.visible");
    cy.contains("의견을 보냈어요").should("not.exist");
    cy.get("#feedback-content").should("have.value", "감사합니다");
    cy.then(() => {
      expect(feedbackCount).to.equal(1);
    });
  });

  it("goes back to settings on cancel", () => {
    mockFeedbackApi();
    cy.visit("/settings/feedback");
    cy.contains("button", "취소").click();
    cy.location("pathname").should("match", /^\/settings\/?$/);
  });
});
