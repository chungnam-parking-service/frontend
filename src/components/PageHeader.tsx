import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PageHeader({ title, backTo = '/' }: { title: string; backTo?: string }) {
  return (
    <header className="page-header">
      <Link to={backTo} className="icon-button" aria-label="뒤로 가기">
        <ArrowLeft size={21} />
      </Link>
      <h1>{title}</h1>
      <Link to="/" className="icon-button" aria-label="입구 홈">
        <Home size={19} />
      </Link>
    </header>
  );
}
