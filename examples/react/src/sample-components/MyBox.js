export default function MyBox({ children }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                color: "#333",
                background: "#99C3EF",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {children}
        </div>
    );
}
