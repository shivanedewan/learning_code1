import React from 'react';

export default function DocuVisionLogo() {
  return (
    // CHANGED: Removed "bg-gray-900" and "p-10"
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-center space-x-6">
        {/* Animated Logo Icon */}
        <div className="relative group">
          {/* Animated outer glow rings */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 via-purple-500 to-violet-600 opacity-30 blur-2xl animate-pulse"></div>
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-violet-600 opacity-20 blur-xl group-hover:opacity-50 transition-all duration-700"></div>
          
          {/* Floating sparkles */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{ animationDelay: '0.3s' }}></div>
          
          {/* Main icon container */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-violet-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 ease-out">
            {/* Animated shine effect */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-40 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out"></div>
            </div>
            
            {/* Rotating ring effect */}
            <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:rotate-180 transition-transform duration-1000 ease-out"></div>
            
            {/* Document icon */}
            <svg 
              className="w-9 h-9 text-white relative z-10 transform group-hover:scale-110 transition-transform duration-700" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="rgba(255,255,255,0.15)"
                className="animate-pulse"
                style={{ animationDuration: '3s' }}
              />
              <path 
                d="M14 2V8H20" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <circle 
                cx="11" 
                cy="14" 
                r="2.5" 
                stroke="currentColor" 
                strokeWidth="1.5"
                fill="none"
                className="origin-center group-hover:animate-pulse"
              />
              <path 
                d="M12.5 15.5L14.5 17.5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                className="transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-300"
              />
            </svg>
          </div>
        </div>

        {/* Animated Text Logo - "Docu" and "Vision" meet */}
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl font-bold tracking-tight flex items-baseline relative overflow-visible">
            
            {/* "Docu" slides in from left */}
            <span className="relative inline-block animate-slide-in-left z-10">
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Docu
              </span>
            </span>
            
            {/* Meeting spark effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full flex justify-center pointer-events-none">
               <span className="w-4 h-4 bg-purple-500 rounded-full animate-spark blur-[2px]"></span>
               <span className="absolute w-20 h-0.5 bg-purple-500 animate-spark-line"></span>
            </div>

            {/* "Vision" slides in from right */}
            <span className="relative inline-block animate-slide-in-right z-10">
              <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-reverse bg-[length:200%_auto]">
                Vision
              </span>
            </span>
            
          </h1>
          
          {/* Animated tagline */}
          <div className="relative overflow-hidden flex justify-center">
            {/* Changed text color to gray-500 for better visibility on light background */}
            <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-gray-600 via-purple-500 to-gray-600 bg-[length:200%_auto] animate-shimmer tracking-[0.2em] font-medium mt-1 animate-fade-in-up opacity-0 uppercase" 
               style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
              Intelligent Document Search
            </p>
          </div>
          
          {/* Decorative line */}
          <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mt-2 animate-expand origin-center"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes gradient-reverse {
          0%, 100% { background-position: 100% 50%; }
          50% { background-position: 0% 50%; }
        }
        
        @keyframes slide-in-left {
          0% { transform: translateX(-150px); opacity: 0; }
          60% { transform: translateX(10px); }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-in-right {
          0% { transform: translateX(150px); opacity: 0; }
          60% { transform: translateX(-10px); }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes spark {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(2.5); filter: brightness(1.5); }
          100% { opacity: 0; transform: scale(0); }
        }

        @keyframes spark-line {
            0% { opacity: 0; transform: scaleX(0); }
            50% { opacity: 0.8; transform: scaleX(1); }
            100% { opacity: 0; transform: scaleX(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes expand {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        
        .animate-gradient { animation: gradient 5s ease infinite; }
        .animate-gradient-reverse { animation: gradient-reverse 5s ease infinite; }
        
        .animate-slide-in-left { animation: slide-in-left 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-slide-in-right { animation: slide-in-right 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        .animate-spark { animation: spark 0.6s ease-out; animation-delay: 0.6s; animation-fill-mode: both; }
        .animate-spark-line { animation: spark-line 0.4s ease-out; animation-delay: 0.65s; animation-fill-mode: both; }
        
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-shimmer { animation: shimmer 3s ease infinite; }
        .animate-expand { animation: expand 1s ease-out forwards; animation-delay: 1.1s; }
      `}</style>
    </div>
  );
}