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
          background: "#000000",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "160px",
          height: "160px",
          background: "#111",
          borderRadius: "32px",
          marginBottom: "40px",
          boxShadow: "0 8px 32px rgba(255,255,255,0.1)",
          border: "2px solid #333",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://airdrop-olive.vercel.app/icon.png"
            width={120}
            height={120}
            style={{ borderRadius: "20px" }}
          />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "120px",
          fontWeight: 900,
          color: "white",
          margin: "0 0 16px 0",
          letterSpacing: "12px",
        }}>
          CLAN
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: "48px",
          color: "rgba(255,255,255,0.6)",
          margin: "0 0 48px 0",
          fontWeight: 400,
          letterSpacing: "2px",
        }}>
          Swap tokens. Anywhere.
        </p>

        {/* Base badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(0,82,255,0.2)",
          borderRadius: "100px",
          padding: "12px 32px",
          border: "2px solid #0052FF",
        }}>
          <div style={{
            width: "32px", height: "32px",
            background: "#0052FF",
            borderRadius: "50%",
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
