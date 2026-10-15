import {
  loginClient,
  toDescription,
  toSummary,
  wizard,
  image,
  api,
} from "./helpers";
describe("S3 evidencias", () => {
  beforeEach(() => loginClient());
  it("S03-TC-056 adjunta y retira con confirmación", () => {
    toSummary();
    image();
    wizard().find('img[alt="Evidencia 1"]').should("be.visible");
    let deletes = 0;
    cy.intercept("DELETE", api() + "/api/v1/requests/*/attachments/*", () => {
      deletes++;
    }).as("removed");
    wizard().contains("button", "Retirar foto 1").click();
    cy.get("dialog").contains("button", "Cancelar").click();
    cy.then(() => expect(deletes).to.eq(0));
    wizard().find("img").should("have.length", 1);
    wizard().contains("button", "Retirar foto 1").click();
    cy.get("dialog").contains("button", "Confirmar").click();
    cy.wait("@removed").its("response.statusCode").should("eq", 204);
    wizard().contains("Foto retirada de la solicitud.").should("be.visible");
    wizard().find("img").should("not.exist");
  });
  it("S03-TC-057 archivo inválido no sube", () => {
    let uploads = 0;
    cy.intercept("POST", api() + "/api/v1/media", () => {
      uploads++;
    });
    toDescription();
    wizard()
      .find("input[type=file]")
      .selectFile({
        contents: Cypress.Buffer.from("pdf"),
        fileName: "invalido.pdf",
        mimeType: "application/pdf",
      });
    wizard().contains("El archivo debe ser una imagen").should("be.visible");
    wizard()
      .find("input[type=file]")
      .selectFile({
        contents: Cypress.Buffer.alloc(5242881),
        fileName: "grande.png",
        mimeType: "image/png",
      });
    wizard().contains("El archivo no debe superar 5 MB.").should("be.visible");
    cy.then(() => expect(uploads).to.eq(0));
  });
  it("S03-TC-058 sexta evidencia bloqueada", () => {
    toSummary();
    for (let i = 0; i < 5; i++) image();
    wizard().find("img").should("have.length", 5);
    wizard().find("input[type=file]").should("be.disabled");
    wizard().contains("máximo 5 fotos").should("be.visible");
  });
});
