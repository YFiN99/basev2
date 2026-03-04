import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0052FF 0%, #FF007A 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "140px",
          height: "140px",
          background: "white",
          borderRadius: "32px",
          marginBottom: "40px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}>
          <span style={{ fontSize: "80px", fontWeight: 900, color: "#0052FF" }}>V2</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "96px",
          fontWeight: 900,
          color: "white",
          margin: "0 0 16px 0",
          letterSpacing: "-2px",
        }}>
          UniSwap V2
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: "48px",
          color: "rgba(255,255,255,0.85)",
          margin: "0 0 40px 0",
          fontWeight: 500,
        }}>
          Swap tokens. Anywhere.
        </p>

        {/* Base badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(255,255,255,0.2)",
          borderRadius: "100px",
          padding: "12px 32px",
          border: "2px solid rgba(255,255,255,0.4)",
        }}>
          <div style={{
            width: "32px", height: "32px",
            background: "#0052FF",
            borderRadius: "50%",
            border: "2px solid white",
          }} />
          <span style={{ fontSize: "36px", color: "white", fontWeight: 700 }}>
            Built on Base
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
