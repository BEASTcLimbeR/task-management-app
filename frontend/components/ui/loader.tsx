import "./loader.css";

// Three merging dots; colours follow --priority-*-accent (green / amber / red)
export default function Loader() {
  return (
    <div aria-hidden="true">
      <div className="goo-loader">
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
      </div>
      <svg className="goo-filter" aria-hidden="true">
        <defs>
          <filter id="task-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
