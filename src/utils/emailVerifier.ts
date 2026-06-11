import axios from 'axios';
import {getRequiredEnv} from "../config/env";

interface HunterResponse {
    data: {
        status: string;
        email: string;
        result: string;
        score: number;
        // Add other fields as needed based on the Hunter API response
    };
}

export const verifyEmail = async (email: string, apiKey = getRequiredEnv("HUNTER_API_KEY")) : Promise<HunterResponse> => {
    const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`;

    try {
        const response = await axios.get<HunterResponse>(url);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to verify email: ${error instanceof Error ? error.message : String(error)}`);
    }
}


