FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY GreenhouseGuard.Api/GreenhouseGuard.Api.csproj GreenhouseGuard.Api/
RUN dotnet restore GreenhouseGuard.Api/GreenhouseGuard.Api.csproj
COPY . .
RUN dotnet publish GreenhouseGuard.Api/GreenhouseGuard.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "GreenhouseGuard.Api.dll"]
