import { Client } from "ssh2";
import { readFileSync, existsSync } from "fs";
import path from "path";

// Load .env file
const envPath = path.join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const SFTP_HOST = "partnerupload.google.com";
const SFTP_PORT = 19321;
const SFTP_USER = process.env.GMC_SFTP_USER || "mc-sftp-5785975591";
const SFTP_PASS = process.env.GMC_SFTP_PASS || "";

const FEED_FILE = path.join(process.cwd(), "public", "merchant-feed.xml");
const REMOTE_FILE = "/merchant-feed.xml";

function uploadFeed(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!existsSync(FEED_FILE)) {
      reject(new Error(`Feed file not found: ${FEED_FILE}. Run 'npm run merchant:generate' first.`));
      return;
    }

    if (!SFTP_PASS) {
      reject(new Error("GMC_SFTP_PASS environment variable not set. Set it in .env or export it."));
      return;
    }

    const conn = new Client();
    const feedData = readFileSync(FEED_FILE);

    console.log(`Connecting to ${SFTP_HOST}:${SFTP_PORT} as ${SFTP_USER}...`);

    conn.on("ready", () => {
      console.log("Connected. Starting SFTP upload...");
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }

        const writeStream = sftp.createWriteStream(REMOTE_FILE);
        writeStream.on("close", () => {
          console.log(`Feed uploaded to ${REMOTE_FILE} (${feedData.length} bytes)`);
          conn.end();
          resolve();
        });
        writeStream.on("error", (writeErr: Error) => {
          conn.end();
          reject(writeErr);
        });

        writeStream.write(feedData);
        writeStream.end();
      });
    });

    conn.on("error", (connErr) => {
      reject(new Error(`SFTP connection error: ${connErr.message}`));
    });

    conn.connect({
      host: SFTP_HOST,
      port: SFTP_PORT,
      username: SFTP_USER,
      password: SFTP_PASS,
      algorithms: {
        serverHostKey: ["ssh-rsa", "ssh-ed25519", "ecdsa-sha2-nistp256", "ecdsa-sha2-nistp384", "ecdsa-sha2-nistp521"],
      },
      readyTimeout: 30000,
    });
  });
}

uploadFeed()
  .then(() => {
    console.log("Done! Feed uploaded successfully to Google Merchant Center.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Upload failed:", err.message || err);
    process.exit(1);
  });
