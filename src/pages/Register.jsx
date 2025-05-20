import React from "react";
import userlogo from "../assets/user2.png";
import card from "../assets/cardsinfondo.png";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css"; // Import del módulo

function Register() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Registrado");
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className={styles.padre}>
      <img src={card} alt="card" />
      <div className={styles["login-container"]}>
        <form className={styles["login-form"]} onSubmit={handleSubmit}>
          <img src={userlogo} alt="user" className={styles["user-image"]} />
          <h2>Registrate en tu billetera de Raulocoins</h2>

          <label htmlFor="nombre">Nombre</label>
          <input type="text" id="nombre" name="nombre" required />

          <label htmlFor="email">Correo electrónico</label>
          <input type="email" id="email" name="email" required />

          <label htmlFor="alias">Alias</label>
          <input type="text" id="alias" name="alias" required />

          <div className={styles["button-group"]}>
            <button type="submit">Registrarme</button>
            <button type="button" onClick={handleBack}>
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
