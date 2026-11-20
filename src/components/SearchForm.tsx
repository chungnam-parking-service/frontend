import { useState, type FormEvent } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SearchForm({
  initialValue = '',
  autoFocus = false,
  action = '/search',
}: {
  initialValue?: string;
  autoFocus?: boolean;
  action?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();
  function submit(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) navigate(`${action}?q=${encodeURIComponent(value.trim())}`);
  }
  return (
    <form className="search-form" role="search" onSubmit={submit}>
      <Search size={20} aria-hidden="true" />
      <input
        aria-label="목적지 검색"
        placeholder="충남 카페·식당 이름 또는 시·군 검색"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={100}
        required
        autoFocus={autoFocus}
        enterKeyHint="search"
        type="search"
      />
      {value && (
        <button
          className="clear-search icon-button"
          type="button"
          aria-label="검색어 지우기"
          onClick={() => setValue('')}
        >
          <X size={16} />
        </button>
      )}
      <button className="search-submit" type="submit" aria-label="검색" disabled={!value.trim()}>
        <ArrowRight size={20} />
      </button>
    </form>
  );
}
