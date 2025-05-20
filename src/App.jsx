import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import styles from "./App.module.css"; // Usamos el módulo
import Register from "./pages/Register.jsx";
import userlogo from "./assets/user2.png";
import Interfaz from "./pages/Interfaz.jsx";
import card from "./assets/cardsinfondo.png";
import { useState } from "react";
import axios from "axios";
import PrivateRoute from "./components/PrivateRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/Interfaz"
          element={
            <PrivateRoute>
              <Interfaz />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [alias, setAlias] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombre = e.target.nombre.value;
    const alias = e.target.alias.value;
    localStorage.setItem("nombre", nombre);
    localStorage.setItem("alias", alias);
    localStorage.setItem("token", token);

    const body = {
      username: alias,
      totpToken: token,
    };
    console.log("Enviando:", body);

    try {
      const response = await axios.post(
        "https://raulocoin.onrender.com/api/verify-totp",
        body
      );
      console.log("Respuesta:", response.data);

      if (response.status === 200 && response.data.success === true) {
        const { operationToken } = response.data;
        localStorage.setItem("operationToken", operationToken);
        navigate("/interfaz");
      } else {
        setError("Alias o token incorrecto.");
        setAlias("");
        setToken("");
      }
    } catch (err) {
      console.error("Error al verificar:", err);
      setError("Alias o token incorrecto.");
      setAlias("");
      setToken("");
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className={styles.padre}>
      <img src={card} alt="" />
      <div className={styles["login-container"]}>
        <form className={styles["login-form"]} onSubmit={handleSubmit}>
          <img src={userlogo} alt="" className={styles["user-image"]} />
          <h2>Bienvenido a tu billetera de Raulocoins</h2>
          <label htmlFor="nombre">Nombre</label>
          <input type="text" id="nombre" name="nombre" required />

          <label htmlFor="alias">Alias</label>
          <input
            type="text"
            id="alias"
            name="alias"
            required
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />

          <label htmlFor="token">Token TOTP</label>
          <input
            type="text"
            id="token"
            name="token"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className={styles["button-group"]}>
            <button type="submit">Ingresar</button>
            <button type="button" onClick={handleRegister}>
              Registrarme
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
