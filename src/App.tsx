import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Message } from './components/Feedback';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { DestinationPage } from './pages/DestinationPage';
import { ParkingPage } from './pages/ParkingPage';
import { WalkingPage } from './pages/WalkingPage';
import { ReportPage } from './pages/ReportPage';
import { AboutPage } from './pages/AboutPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="report" element={<SearchPage forReport />} />
        <Route path="places/:placeId/report" element={<ReportPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="places/:placeId" element={<DestinationPage />} />
        <Route path="places/:placeId/parking/:lotId" element={<ParkingPage />} />
        <Route path="places/:placeId/parking/:lotId/walk" element={<WalkingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route
          path="*"
          element={
            <Message title="페이지를 찾을 수 없어요">
              주소를 확인하거나 처음부터 다시 찾아주세요.
            </Message>
          }
        />
      </Route>
    </Routes>
  );
}
