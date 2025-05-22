import React, { useState } from "react";
import userlogo from "../assets/user2.png";
import card from "../assets/cardsinfondo.png";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [totpToken, setTotpToken] = useState("");

  const [totpSetup, setTotpSetup] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [verificationMessage, setVerificationMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      email,
      username,
    };

    try {
      const response = await fetch(
        "https://raulocoin.onrender.com/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("registro");
      console.log("enviando", response);
      console.log("recibiendo:", data);

      if (data.success) {
        setTotpSetup(data.totpSetup);
        setShowModal(true);
      } else {
        alert("Registro fallido: " + data.message);
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      alert("Error al conectar con el servidor");
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setVerificationMessage(null);
  };

  const handleVerifyTOTP = async () => {
    const payload = {
      username,
      totpToken,
    };

    try {
      const response = await fetch(
        "https://raulocoin.onrender.com/api/verify-totp-setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("verificacion");
      console.log("enviando", response);
      console.log("recibiendo:", data);

      if (data.success) {
        setVerificationMessage(
          "✅ Verificación exitosa. Ya podés usar tu cuenta."
        );
      } else {
        setVerificationMessage("❌ Código incorrecto. Intentá nuevamente.");
      }
    } catch (error) {
      console.error("Error al verificar TOTP:", error);
      setVerificationMessage("❌ Hubo un error al verificar el código.");
    }
  };

  return (
    <div className={styles.padre}>
      <img src={card} alt="card" />
      <div className={styles["login-container"]}>
        <form className={styles["login-form"]} onSubmit={handleSubmit}>
          <img src={userlogo} alt="user" className={styles["user-image"]} />
          <h2>Registrate en tu billetera de Raulocoins</h2>

          <label htmlFor="nombre">Nombre</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="email">Correo electrónico</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="alias">Alias</label>
          <input
            type="text"
            id="alias"
            name="alias"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className={styles["button-group"]}>
            <button type="submit">Registrarme</button>
            <button type="button" onClick={handleBack}>
              Volver
            </button>
          </div>
        </form>
      </div>

      {/* Modal para el QR y verificación TOTP */}
      {showModal && totpSetup && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal-content"]}>
            <button
              className={styles["close-button"]}
              onClick={handleCloseModal}
            >
              &times;
            </button>
            <h3>Autenticación de dos factores</h3>
            <img
              src={totpSetup.qrCodeUrl}
              alt="QR de autenticación"
              style={{ width: "200px", marginBottom: "10px" }}
            />
            <p>{totpSetup.instructions}</p>

            <div style={{ marginTop: "15px" }}>
              <label>Ingresa el código de 6 dígitos:</label>
              <input
                type="text"
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
                maxLength={6}
                style={{ margin: "10px 0", padding: "6px", width: "100%" }}
              />
              <button
                className={styles.verifyButton}
                onClick={handleVerifyTOTP}
              >
                Verificar código
              </button>

              {verificationMessage && (
                <p style={{ marginTop: "10px" }}>{verificationMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
