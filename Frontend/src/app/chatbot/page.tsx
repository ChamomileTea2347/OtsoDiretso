"use client";

import { useState, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import { useRouter } from "next/navigation";

export default function ChatbotPage() {
  const router = useRouter();

  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [hotlinesOpen, setHotlinesOpen] = useState(false);

  type Message = {
    text: string;
    sender: "user" | "bot";
  };

  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi User! How can I help?", sender: "bot" },
  ]);

  const [input, setInput] = useState("");
  const [guestToken, setGuestToken] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      fetch("http://127.0.0.1:8000/api/guest", { method: "POST" })
        .then((res) => res.json())
        .then((data) => setGuestToken(data.session_token))
        .catch(() => {});
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      { text: userMessage, sender: "user" },
    ]);

    setInput("");

    try {
      const authToken = localStorage.getItem("token");
      const isGuest = !authToken;

      const res = await fetch(
        isGuest
          ? "http://127.0.0.1:8000/api/guest/chat"
          : "http://127.0.0.1:8000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(isGuest ? {} : { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify(
            isGuest
              ? { message: userMessage, guest_session_token: guestToken }
              : { message: userMessage }
          ),
        }
      );

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { text: data.reply || "No response from server", sender: "bot" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "Error connecting to server", sender: "bot" },
      ]);
    }
  };

  return (
    <div className="flex h-screen bg-chat-gradient overflow-hidden">

      {/* SIDEBAR */}
      <div
        className={`bg-[#faf3dd] shadow-lg transition-all duration-300 overflow-hidden
        ${menuOpen ? "w-64" : "w-0"}`}
      >
        {menuOpen && (
          <div className="p-5 flex flex-col gap-4 h-full">

            <img
              src="/CapyBuddy.png"
              alt="Avatar"
              className="w-20 h-19 rounded-full self-center mb-4"
            />

            <button
              onClick={() => setHotlinesOpen(true)}
              className="text-left hover:underline text-black"
            >
              Emergency Hotlines
            </button>

            {/* ABOUT US MODAL TRIGGER */}
            <button
              onClick={() => setAboutOpen(true)}
              className="text-left hover:underline text-black"
            >
              About Us
            </button>

            <button
              onClick={() => router.push("/history")}
              className="text-left hover:underline text-black"
            >
              Chat History
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/");
              }}
              className="text-left text-red-600 hover:underline mt-auto"
            >
              Log Out
            </button>

          </div>
        )}
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 transition-all duration-300">

        {/* TOP BAR */}
        <div className="flex items-center p-4">
          {acceptedDisclaimer && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-2xl font-bold text-black"
            >
              ☰
            </button>
          )}
        </div>

        {/* DISCLAIMER */}
        {!acceptedDisclaimer && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-300 bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-black">Disclaimer</h2>

              <p className="mt-3 text-sm leading-6 text-gray-800">
                This chatbot is intended to provide comfort, emotional support, and general
                encouragement for students. It is not a replacement for a licensed therapist,
                counselor, psychologist, psychiatrist, or any other mental health professional.
                It does not provide diagnosis, treatment, crisis intervention, or medical advice.
                If you are in distress, experiencing a mental health emergency, or need
                professional support, please contact a licensed mental health provider or
                appropriate emergency services. To protect your privacy, please avoid sharing
                sensitive personal information such as your full name, address, contact details,
                school identification numbers, or any confidential data. This chatbot is designed
                for general support, and users are responsible for the information they choose
                to share. By clicking “I Agree” or “Continue,” you acknowledge and accept these
                terms, including your responsibility to safeguard your personal information while
                using this service.
              </p>

              <button
                onClick={() => setAcceptedDisclaimer(true)}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-white"
              >
                I Agree
              </button>
            </div>
          </div>
        )}

        {/* SCROLLABLE CHAT AREA WITH HEADER */}
        <div className="flex-1 overflow-y-auto px-4 py-2">

          {/* HEADER */}
          <div className="flex flex-col items-center pt-0 pb-3 -mt-2">
            <img
              src="/capyAvatar.gif"
              className="h-20 w-20 rounded-full mb-1"
            />

            <h1 className="text-2xl font-bold text-black leading-tight">
              CapyBuddy
            </h1>

            <p className="text-sm text-gray-700">
              A safe space to talk and be heard.
            </p>

            <hr className="mt-3 w-full border-gray-300" />
          </div>

          {/* CHAT */}
          <ChatWindow messages={messages} />

        </div>

        {/* INPUT */}
        <div className="flex border-t p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!acceptedDisclaimer}
            className="flex-1 rounded-full border p-3 text-black"
            placeholder="Share your thoughts..."
          />

          <button
            onClick={sendMessage}
            disabled={!acceptedDisclaimer}
            className="ml-2 rounded-full bg-blue-600 px-4 text-white"
          >
            ➤
          </button>
        </div>

      </div>

      {/* ABOUT US MODAL */}
      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          
          <div className="w-full max-w-5xl rounded-2xl bg-white p-8 shadow-xl relative overflow-y-auto max-h-[90vh]">

            {/* HEADER */}
            <h2 className="text-3xl font-bold mb-3">About This Chatbot</h2>

            <p className="text-sm text-gray-700 leading-6 mb-6">
              This AI chatbot was developed as part of a research project aimed at providing
              emotional support and conversational assistance to students. It is designed to
              offer a safe space for users to express their thoughts and receive supportive responses.
              <br /><br />
              <b>Purpose:</b><br />
              - Provide emotional support<br />
              - Encourage self-reflection<br />
              - Assist students in managing stress and concerns<br /><br />

              <b>Note:</b> This system is not a replacement for professional mental health care.
            </p>

            {/* TEAM SECTION */}
            <h3 className="text-xl font-semibold mb-4">Developers / Team Members</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">

              {/* Member 1 */}
              <div className="flex flex-col items-center">
                <img src="/members\AuBumanglag.png" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                <p className="mt-2 text-sm">Au Bumanglag</p>
              </div>

              {/* Member 2 */}
              <div className="flex flex-col items-center">
                <img src="/members/TomieDeLeon.png" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                <p className="mt-2 text-sm">Tomie De Leon</p>
              </div>

              {/* Member 3 */}
              <div className="flex flex-col items-center">
                <img src="/members/RamilGrabador.jpg" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                <p className="mt-2 text-sm">Ramil Grabador</p>
              </div>

              {/* Member 4 */}
              <div className="flex flex-col items-center">
                <img src="/members/JulianneGuiao.png" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                <p className="mt-2 text-sm">Julianne Mikaela Guiao</p>
              </div>

              {/* Member 5 */}
              <div className="flex flex-col items-center">
                <img src="/members/AdrianOrdonio.png" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                <p className="mt-2 text-sm">Adrian James Ordonio</p>
              </div>

              {/* Member 6 */}
              <div className="flex flex-col items-center">
                <img src="/members/AbigailPalacay.png" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                <p className="mt-2 text-sm">Abigail Palacay</p>
              </div>

              {/* Member 7 */}
              <div className="flex flex-col items-center">
                <img src="/members/BryanPascual.png" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                <p className="mt-2 text-sm">Jermaine Bryan Pascual</p>
              </div>

              {/* Member 8 */}
              <div className="flex flex-col items-center">
                <img src="/members/JMSollorin.jpg" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                <p className="mt-2 text-sm">John Michael Sollorin</p>
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setAboutOpen(false)}
              className="mt-8 w-full rounded-lg bg-blue-600 px-4 py-3 text-white"
            >
              Close
            </button>

          </div>
        </div>
      )}

      {/* EMERGENCY HOTLINES MODAL */}
      {hotlinesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-xl relative max-h-[90vh] overflow-y-auto">

            <h2 className="text-2xl font-bold mb-4">Emergency Hotlines</h2>

            <p className="text-sm text-gray-600 mb-6">
              If you are in immediate danger or experiencing a mental health crisis,
              please contact the appropriate hotline below.
            </p>

            {/* HOTLINES LIST */}
            <div className="space-y-4 text-sm">

              <div className="p-4 border rounded-lg">
                <p className="font-semibold">National Mental Health Crisis Hotline (PH)</p>
                <p>📞 1553</p>
                <p className="text-gray-600">Available 24/7 for mental health emergencies</p>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="font-semibold">NCMH Crisis Hotline (Mobile)</p>
                <p>📞 0966-351-4518</p>
                <p className="text-gray-600">📞 0917-899-8727</p>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="font-semibold">Emergency Services (Philippines)</p>
                <p>📞 911</p>
                <p className="text-gray-600">For immediate life-threatening emergencies</p>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="font-semibold">SLU Guidance Office (Sample)</p>
                <p>📞 (Insert school hotline here)</p>
                <p className="text-gray-600">For student counseling and support</p>
              </div>

            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setHotlinesOpen(false)}
              className="mt-6 w-full rounded-lg bg-red-600 px-4 py-3 text-white"
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}