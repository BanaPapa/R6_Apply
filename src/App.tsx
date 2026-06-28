import { useState } from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { ApplyModule } from './components/ApplyModule';

/**
 * 독립 실행용 dev 래퍼.
 * 통합 시 naver-kb의 App.tsx가 <ApplyModule userId={user?.id} /> 를 탭으로 임포트한다.
 */
export default function App() {
  const [sideCollapsed, setSideCollapsed] = useState(false);

  return (
    <div className={`eos-app${sideCollapsed ? ' side-collapsed' : ''}`}>
      <Sidebar collapsed={sideCollapsed} onToggleCollapse={() => setSideCollapsed((v) => !v)} />
      <ApplyModule />
    </div>
  );
}
