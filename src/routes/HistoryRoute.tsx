import { useProfile } from '../contexts/ProfileContext';
import { HistoryScreen } from '../components/HistoryScreen';

export function HistoryRoute() {
  const { userId } = useProfile();
  return <HistoryScreen userId={userId} />;
}
