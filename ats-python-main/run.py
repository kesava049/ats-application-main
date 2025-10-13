#!/usr/bin/env python3
"""
Simple run script for the Resume Parser application.
"""

import asyncio
import socket
import uvicorn
from app.config.settings import settings
from app.services.job_embedding_service import job_embedding_service

async def show_startup_status():
    """Show comprehensive startup status."""
    try:
        # Import and use the comprehensive startup status service
        from app.services.startup_status_service import startup_status_service
        
        # Display comprehensive startup status with timeout
        await asyncio.wait_for(
            startup_status_service.display_comprehensive_startup_status(),
            timeout=30.0  # 30 second timeout
        )
        
    except asyncio.TimeoutError:
        print("⚠️  Startup status check timed out - database may be slow to respond")
        print("🚀 Starting Resume Parser Backend...")
        print("=" * 60)
        print(f"🎯 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
        print(f"🌐 Server will be available at: http://localhost:{settings.PORT}")
        print(f"📚 API Documentation: http://localhost:{settings.PORT}/docs")
        print(f"📖 ReDoc Documentation: http://localhost:{settings.PORT}/redoc")
        print("=" * 60)
        print("ℹ️  For detailed system status, visit: /startup-status")
        
    except Exception as e:
        print(f"⚠️  Could not show comprehensive startup status: {str(e)}")
        # Fallback to basic startup message
        print("🚀 Starting Resume Parser Backend...")
        print("=" * 60)
        print(f"🎯 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
        print(f"🌐 Server will be available at: http://localhost:{settings.PORT}")
        print(f"📚 API Documentation: http://localhost:{settings.PORT}/docs")
        print(f"📖 ReDoc Documentation: http://localhost:{settings.PORT}/redoc")
        print("=" * 60)
        print("ℹ️  For detailed system status, visit: /startup-status")

def _find_available_port(preferred_port: int, max_tries: int = 20) -> int:
    """Return an available port, starting from preferred_port and incrementing.

    This prevents crashes when a second instance is accidentally started and the
    default port is already in use.
    """
    port = preferred_port
    for _ in range(max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("0.0.0.0", port))
                return port
            except OSError:
                port += 1
    return preferred_port


if __name__ == "__main__":
    # Show startup status
    asyncio.run(show_startup_status())

    # Choose a free port to avoid "address already in use" errors locally
    chosen_port = _find_available_port(int(settings.PORT))
    if chosen_port != int(settings.PORT):
        print(f"⚠️  Port {settings.PORT} occupied. Starting on available port {chosen_port} instead.")

    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=chosen_port,
        reload=settings.DEBUG,
        log_level="info"
    )
