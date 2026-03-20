import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { useUI } from '../contexts/UIContext';
import { MenuScanner } from '../components/MenuScanner';

export function ScannerRoute() {
  const navigate = useNavigate();
  const { userId, comprehensiveProfile } = useProfile();
  const { scanMode, setScanMode } = useUI();

  return (
    <MenuScanner
      onScanComplete={(recommendations) => {
        navigate('/recommendations', { state: { apiRecommendations: recommendations } });
      }}
      comprehensiveProfile={comprehensiveProfile}
      scanMode={scanMode}
      setScanMode={setScanMode}
      userId={userId}
    />
  );
}
