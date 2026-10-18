/**
 * 웹 다운로드 안내(/download)와 Android 출시 알림 신청(/download/android).
 *
 * 실제 차단(브라우저면 어느 주소든 이 안내를 그림)은 배포 빌드에만 켜지는 플래그라 여기서는
 * 볼 수 없다 — 판정은 src/shared/lib/webGate.test.ts 가 맡는다. 여기서는 두 화면 자체를 본다.
 * 신청 API 계약은 FE 가 BE 에 요청한 명세다(docs/be-request-launch-notifications.md).
 */

const APP_STORE_URL = "https://apps.apple.com/kr/app/%EB%94%94%ED%86%A0/id6809342012";

type LaunchNotificationPayload = {
  email: string;
  platform: string;
  privacyConsent: boolean;
  consentVersion: string;
};

let lastLaunchNotification: LaunchNotificationPayload | null = null;

function mockLaunchNotificationApi(options: { failWith?: { code: string; message: string } } = {}) {
  lastLaunchNotification = null;
  cy.intercept("POST", "**/api/**/launch-notification-requests", (req) => {
    lastLaunchNotification = req.body as LaunchNotificationPayload;
    if (options.failWith) {
      req.reply({
        statusCode: 200,
        body: { success: false, data: null, error: { statusCode: 400, ...options.failWith } },
      });
      return;
    }
    req.reply({ success: true, data: null });
  }).as("requestLaunchNotification");
}

describe("web download", () => {
  beforeEach(() => {
    cy.mockApi();
  });

  it("links straight to the App Store and opens without logging in", () => {
    cy.visit("/download");

    cy.contains("디토는 앱에서 이용할 수 있어요").should("be.visible");
    cy.contains("a", "App Store에서 다운로드").should("have.attr", "href", APP_STORE_URL);
    cy.contains("Android 앱은 준비 중이에요.").should("be.visible");
    // 비로그인 공개 경로라 로그인 화면으로 튕기지 않는다.
    cy.location("pathname").should("match", /^\/download\/?$/);
  });

  it("opens the privacy policy and support pages from the footer", () => {
    cy.visit("/download");
    cy.contains("button", "개인정보처리방침").click();
    cy.location("pathname", { timeout: 8000 }).should("match", /^\/settings\/privacy\/?$/);
    // v1.2 에 신설한 출시 알림 신청 항목이 방침에 적혀 있다.
    cy.contains("Android 앱 출시 알림 신청 정보(이메일 주소) — 신청일로부터 3개월").should("exist");
  });

  it("signs up for the Android launch notification with email and consent", () => {
    mockLaunchNotificationApi();
    cy.visit("/download");
    cy.contains("button", "Android 출시 알림 받기").click();
    cy.location("pathname").should("match", /^\/download\/android\/?$/);

    // 동의 문구에는 항목·목적·보유 기간·거부할 권리가 모두 있다.
    cy.contains("이메일 주소").should("be.visible");
    cy.contains("Android 앱 출시 안내 메일 발송").should("be.visible");
    cy.contains("신청일로부터 3개월").should("be.visible");
    cy.contains("동의하지 않을 수 있으며").should("be.visible");

    cy.contains("button", "알림 신청하기").should("be.disabled");

    // 형식이 틀리면 입력을 마친 뒤 알려 주고 신청할 수 없다.
    cy.get("#launch-notification-email").type("not-an-email").blur();
    cy.contains("이메일 형식이 올바르지 않아요.").should("be.visible");
    cy.contains("button", "알림 신청하기").should("be.disabled");

    cy.get("#launch-notification-email").clear().type(" user@example.com ").blur();
    cy.contains("이메일 형식이 올바르지 않아요.").should("not.exist");
    // 이메일만으로는 안 된다 — 동의가 필수다.
    cy.contains("button", "알림 신청하기").should("be.disabled");
    cy.contains("[필수] 개인정보 수집·이용에 동의합니다").click();
    cy.contains("button", "알림 신청하기").should("not.be.disabled").click();
    cy.wait("@requestLaunchNotification");

    cy.contains("알림 신청이 끝났어요").should("be.visible");
    cy.then(() => {
      expect(lastLaunchNotification).to.deep.equal({
        email: "user@example.com",
        platform: "ANDROID",
        privacyConsent: true,
        consentVersion: "2026-10-19",
      });
    });

    cy.contains("button", "확인").click();
    cy.location("pathname").should("match", /^\/download\/?$/);
  });

  it("explains when the server rejects the email (0001)", () => {
    mockLaunchNotificationApi({ failWith: { code: "0001", message: "요청 값이 올바르지 않습니다." } });
    cy.visit("/download/android");

    cy.get("#launch-notification-email").type("user@example.com").blur();
    cy.contains("[필수] 개인정보 수집·이용에 동의합니다").click();
    cy.contains("button", "알림 신청하기").click();
    cy.wait("@requestLaunchNotification");

    cy.contains("이메일 주소를 다시 확인해 주세요.").should("be.visible");
    cy.contains("알림 신청이 끝났어요").should("not.exist");
    cy.get("#launch-notification-email").should("have.value", "user@example.com");
  });
});
