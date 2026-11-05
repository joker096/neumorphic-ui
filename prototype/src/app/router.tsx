import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { LetsYouInScreen } from '../screens/onboarding/LetsYouInScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { CreateAccountScreen } from '../screens/auth/CreateAccountScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { FillProfileScreen } from '../screens/auth/FillProfileScreen';
import { CreatePinScreen } from '../screens/auth/CreatePinScreen';
import { FingerprintScreen } from '../screens/auth/FingerprintScreen';
import { ChatListScreen } from '../screens/chats/ChatListScreen';
import { SelectContactScreen } from '../screens/chats/SelectContactScreen';
import { ConversationScreen } from '../screens/chats/ConversationScreen';
import { CameraScreen } from '../screens/chats/CameraScreen';
import { VoiceCallScreen } from '../screens/calls/VoiceCallScreen';
import { VideoCallScreen } from '../screens/calls/VideoCallScreen';
import { ContactInfoScreen } from '../screens/profile/ContactInfoScreen';
import { SharedMediaScreen } from '../screens/profile/SharedMediaScreen';
import { KitPage } from '../screens/kit/KitPage';

export function Router() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/lets-you-in" element={<LetsYouInScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/create-account" element={<CreateAccountScreen />} />
        <Route path="/otp" element={<OtpScreen />} />
        <Route path="/fill-profile" element={<FillProfileScreen />} />
        <Route path="/create-pin" element={<CreatePinScreen />} />
        <Route path="/fingerprint" element={<FingerprintScreen />} />
        <Route path="/home" element={<ChatListScreen />} />
        <Route path="/select-contact" element={<SelectContactScreen />} />
        <Route path="/chat/:id" element={<ConversationScreen />} />
        <Route path="/chat/:id/camera" element={<CameraScreen />} />
        <Route path="/call/:id/voice" element={<VoiceCallScreen />} />
        <Route path="/call/:id/video" element={<VideoCallScreen />} />
        <Route path="/contact/:id" element={<ContactInfoScreen />} />
        <Route path="/contact/:id/media" element={<SharedMediaScreen />} />
        <Route path="/kit" element={<KitPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
