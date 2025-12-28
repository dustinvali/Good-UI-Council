/**
 * Council logo SVG component - reused across Sidebar and EmptyState.
 */
export default function Logo({ className = '', size = 64 }) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g stroke="currentColor" strokeWidth="2.5" fill="none">
                <path d="M32 10 L51.05 21 L51.05 43 L32 54 L12.95 43 L12.95 21 Z" />
                <path d="M32 10 L32 54 M51.05 21 L12.95 43 M51.05 43 L12.95 21" />
            </g>
            <g fill="currentColor">
                <circle cx="32" cy="10" r="4.5" />
                <circle cx="51.05" cy="21" r="4.5" />
                <circle cx="51.05" cy="43" r="4.5" />
                <circle cx="32" cy="54" r="4.5" />
                <circle cx="12.95" cy="43" r="4.5" />
                <circle cx="12.95" cy="21" r="4.5" />
            </g>
            <circle cx="32" cy="32" r="7" fill="#FAFAF7" />
        </svg>
    );
}
