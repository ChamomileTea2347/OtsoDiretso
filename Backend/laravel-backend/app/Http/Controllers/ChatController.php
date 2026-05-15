<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\GuestSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatController extends Controller
{
    /**
     * Handle an incoming chat message.
     *
     * This is the main endpoint the frontend calls when a user
     * sends a message. It:
     * 1. Validates the sender (registered user or guest)
     * 2. Saves the user's message to the database
     * 3. Forwards the message to FastAPI for AI processing
     * 4. Saves the bot's response to the database
     * 5. Returns the response to the frontend
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message'             => 'required|string',
            'guest_session_token' => 'nullable|string',
        ]);

        $userId           = null;
        $guestToken       = null;

        // Determine if this is a registered user or guest
        if ($request->user()) {
            $userId = $request->user()->id;
        } else {
            // Guest flow — validate their session token
            $guest = GuestSession::where(
                'session_token', $request->guest_session_token
            )->first();

            if (! $guest || $guest->isExpired()) {
                return response()->json([
                    'message' => 'Invalid or expired guest session'
                ], 401);
            }

            $guestToken = $request->guest_session_token;
        }

        // Save the user's message to the database
        ChatMessage::create([
            'user_id'             => $userId,
            'guest_session_token' => $guestToken,
            'role'                => 'user',
            'message'             => $request->message,
        ]);

        // Forward message to FastAPI AI service
        // For now FastAPI returns an echo — later this will
        // return the actual LLM response
        $aiResponse = Http::post('http://127.0.0.1:8001/chat', [
            'message' => $request->message,
        ]);

        $botReply = $aiResponse->json('reply') ?? 'Sorry, I could not process that.';
        $riskLevel = $aiResponse->json('risk_level') ?? 'safe';


        // Save the bot's response to the database
        ChatMessage::create([
            'user_id'             => $userId,
            'guest_session_token' => $guestToken,
            'role'                => 'bot',
            'message'             => $botReply,
        ]);

        return response()->json([
            'reply' => $botReply,
            'risk_level' => $riskLevel,
        ]);
    }

    /**
     * Retrieve chat history for a registered user.
     * Guests don't get persistent history — their messages
     * exist only within their session.
     */
    public function getHistory(Request $request)
    {
        $messages = ChatMessage::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'asc')
            ->get(['role', 'message', 'created_at']);

        return response()->json([
            'history' => $messages,
        ]);
    }

    /**
     * Delete all chat history for a registered user.
     * Gives users control over their data — important for
     * privacy and aligns with the thesis ethics considerations.
     */
    public function deleteHistory(Request $request)
    {
        ChatMessage::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'Chat history deleted successfully',
        ]);
    }
}
