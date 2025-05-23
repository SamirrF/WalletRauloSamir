import styles from "./interfaz.module.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "./styles3.css";

function Interfaz() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem("nombre") || "Usuario";
  const alias = localStorage.getItem("alias") || "alias";
  const operationToken = localStorage.getItem("token") || "";

  const [saldo, setSaldo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("todos");

  // Función para dar formato a la fecha unix timestamp
  const formatDate = (unixTimestamp) => {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleString(); // Fecha y hora local legible
  };

  const [showModal, setShowModal] = useState(false);
  const [toAlias, setToAlias] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [token, setToken] = useState("");
  const [transferError, setTransferError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  //Funcion para PDF
  const descargarComprobantePDF = (tx) => {
    const doc = new jsPDF();

    // Colores
    const primaryColor = "#2C3E50"; // azul oscuro
    const accentColor = "#3498DB"; // azul claro
    const textColor = "#333";

    // Estilo del encabezado
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 30, "F"); // fondo header

    doc.setTextColor(255, 255, 255); // blanco
    doc.setFontSize(18);

    doc.text("COMPROBANTE DE TRANSFERENCIA", 105, 20, { align: "center" });

    // Cuerpo
    doc.setFontSize(12);
    doc.setTextColor(textColor);

    let y = 50;

    const addField = (label, value) => {
      doc.setTextColor(accentColor);
      doc.text(label, 20, y);
      doc.setTextColor(textColor);
      doc.text(String(value), 70, y);
      y += 10;
    };

    addField("Fecha", formatDate(tx.createdAt));
    addField("De", `${tx.fromName} (${tx.fromUsername})`);
    addField("Para", `${tx.toName} (${tx.toUsername})`);
    addField("Monto", `$${tx.amount}`);
    addField("Descripción", tx.description || "Sin descripción");
    addField("ID Transacción", tx.id);

    // Línea final
    doc.setDrawColor(accentColor);
    doc.line(20, y + 5, 190, y + 5);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor("#999");
    doc.text("Gracias por utilizar nuestra Wallet", 105, 285, {
      align: "center",
    });

    // Guardar PDF
    doc.save(`comprobante_${tx.id}.pdf`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    if (!alias || !operationToken) {
      setError("No se encontró usuario o token. Por favor, inicie sesión.");
      return;
    }

    // Función para obtener saldo y movimientos
    const fetchData = async () => {
      try {
        // Obtener saldo
        const balanceResp = await axios.post(
          "https://raulocoin.onrender.com/api/balance",
          {
            username: alias,
            totpToken: operationToken,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (balanceResp.data.success) {
          setSaldo(balanceResp.data.user.balance);
        } else {
          setError("No se pudo obtener el saldo.");
          return;
        }

        // Obtener transacciones
        const txResp = await axios.post(
          "https://raulocoin.onrender.com/api/transactions",
          {
            username: alias,
            totpToken: operationToken,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log("respuesta transacciones", txResp.data);
        if (txResp.data.success) {
          setTransactions(txResp.data.transactions);
        } else {
          setError("No se pudo obtener el historial de movimientos.");
        }
      } catch (err) {
        setError("Error al conectar con el servidor.");
      }
    };

    fetchData();
  }, [alias, operationToken]);

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await axios.get(
        `https://raulocoin.onrender.com/api/search-users?q=${query}`
      );
      if (response.data.success) {
        setSuggestions(response.data.users);
      }
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
    }
    setIsLoadingSuggestions(false);
  };

  const handleTransfer = async () => {
    try {
      // Paso 1: Verificar TOTP
      const verifyResponse = await axios.post(
        "https://raulocoin.onrender.com/api/verify-totp",
        {
          username: alias,
          totpToken: token,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!verifyResponse.data.success) {
        setTransferError("Error: " + verifyResponse.data.message);
        return;
      }

      const operationToken = verifyResponse.data.operationToken;

      // Paso 2: Realizar transferencia
      const transferResponse = await axios.post(
        "https://raulocoin.onrender.com/api/transfer",
        {
          fromUsername: alias,
          toUsername: toAlias,
          amount: parseFloat(amount),
          description,
          operationToken, // token verificado
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (transferResponse.data.success) {
        const newBalance = transferResponse.data.transfer.from.newBalance;

        // Actualizar saldo y añadir nueva transacción
        setSaldo(newBalance);
        setTransactions((prev) => [
          {
            id: Date.now(), // temporal hasta que el backend lo devuelva con ID
            createdAt: transferResponse.data.transfer.timestamp,
            description: transferResponse.data.transfer.description,
            fromName: transferResponse.data.transfer.from.name,
            fromUsername: transferResponse.data.transfer.from.username,
            toName: transferResponse.data.transfer.to.name,
            toUsername: transferResponse.data.transfer.to.username,
            amount: -transferResponse.data.transfer.amount,
          },
          ...prev,
        ]);

        // Resetear estado del modal
        setShowModal(false);
        setToAlias("");
        setAmount("");
        setDescription("");
        setToken("");
        setTransferError("");
        alert("Transferencia realizada con éxito");
      } else {
        setTransferError("Error: " + transferResponse.data.message);
      }
    } catch (error) {
      setTransferError("Error al realizar la transferencia.");
    }
  };

  return (
    <div className={styles.principal}>
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.initialCircle}>
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className={styles.textInfo}>
            <div className={styles.nombre}>{nombre}</div>
            <div className={styles.alias}>{alias}</div>
          </div>
        </div>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className={styles.contenedor}>
        <div className={styles.saldoCard}>
          <h1>Saldo disponible</h1>
          {saldo !== null ? (
            <p>${saldo}</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <p>Cargando saldo...</p>
          )}
        </div>
        {/* Botón para abrir el modal */}
        <div className={styles.contenedortransferirbtn}>
        <button
          className={styles.transferirBtn}
          onClick={() => setShowModal(true)}
        >
          Transferir
        </button>
        </div>

        {/* Modal de transferencia */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Realizar Transferencia</h2>
              <div className={styles.suggestionsContainer}>
                <input
                  type="text"
                  placeholder="Alias destinatario"
                  value={toAlias}
                  onChange={(e) => {
                    const value = e.target.value;
                    setToAlias(value);
                    fetchSuggestions(value);
                  }}
                />

                {isLoadingSuggestions && <p>Cargando...</p>}

                {suggestions.length > 0 && (
                  <ul className={styles.suggestionsList}>
                    {suggestions.map((user) => (
                      <li
                        key={user.username}
                        onClick={() => {
                          setToAlias(user.username);
                          setSuggestions([]);
                        }}
                      >
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userAlias}>
                          @{user.username}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input
                type="number"
                placeholder="Monto"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                type="text"
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                type="text"
                placeholder="Token TOTP"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <button onClick={handleTransfer}>Confirmar Transferencia</button>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
              {transferError && <p style={{ color: "red" }}>{transferError}</p>}
            </div>
          </div>
        )}

        <div className={styles.movimientos}>
          <h2>Historial de movimientos</h2>
          {transactions.length > 0 ? (
            <ul style={{ listStyleType: "none", padding: 0, width: "100%",maxWidth:"500px"}}>
              {transactions.map((tx) => (
                <li key={tx.id} className={styles.movimientoCard}>
                  <strong>{formatDate(tx.createdAt)}</strong>
                  <p>
                    <strong>Descripción:</strong> {tx.description}
                  </p>
                  <p>
                    <strong>De:</strong> {tx.fromName} ({tx.fromUsername})
                  </p>
                  <p>
                    <strong>Para:</strong> {tx.toName} ({tx.toUsername})
                  </p>
                  <p>Monto:</p>
                  <p
                    className={`${styles.amount} ${
                      tx.amount < 0 ? styles.negative : styles.positive
                    }`}
                  >
                    {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount)}
                  </p>
                  <button
                    className="btn-comprobante"
                    onClick={() => descargarComprobantePDF(tx)}
                  >
                    Descargar comprobante PDF
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "white" }}>No hay movimientos para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Interfaz;
