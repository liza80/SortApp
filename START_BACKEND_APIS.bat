@echo off
echo Starting all backend APIs for Container Creation...
echo =============================================

echo.
echo [1/3] Starting CourierApi on port 5001...
start "CourierApi" cmd /k "cd /d c:\Users\liza\Source\Repos\courier-api\CourierApi\CourierApi && dotnet run"

echo.
echo [2/3] Starting OperationalApp on port 7001...
start "OperationalApp" cmd /k "cd /d c:\Users\liza\Source\Repos\OperationalApp\OperationalApp\OperationalApp && dotnet run"

echo.
echo [3/3] Starting RUN_app on port 5000...
start "RUN_app" cmd /k "cd /d c:\Users\liza\Source\Repos\RUN_app && dotnet run --project RunCom.WebAPI"

echo.
echo =============================================
echo All APIs are starting...
echo.
echo Wait a few seconds for them to fully load, then check:
echo   - CourierApi:       http://localhost:5001/swagger
echo   - OperationalApp:   http://localhost:7001/swagger
echo   - RUN_app:          http://localhost:5000
echo.
echo Press any key to exit this window...
pause > nul
