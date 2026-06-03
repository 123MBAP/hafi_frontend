import { useParams } from 'react-router-dom';
import ChatBot from '../../pages/ChatBox';
import {jwtDecode} from "jwt-decode";
import { useAuth } from '../../context/AuthContext';

interface JwtPayload {
  id: string; // or providerId depending on your token's claim
  // ...other fields you might have
}

export function getProviderIdFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.id;  // adjust if your token uses a different key
  } catch (e) {
    console.error('Invalid token', e);
    return null;
  }
}


export default function ChatWrapper({ providerId }: { providerId: string }) {
  const { customerId } = useParams(); // get customerId from the URL

  return (
    <ChatBot
      providerId={providerId}            // from parent (e.g. logged-in provider)
      customerId={customerId || ''}
      currentUserRole='provider'      // from the URL
      onClose={() => window.history.back()} // go back when chat is closed
    />
  );
}
