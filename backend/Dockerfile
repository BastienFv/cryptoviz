# syntax=docker/dockerfile:1.7

### 1) Build stage
FROM golang:1.25 AS build
WORKDIR /src

# Copie d'abord les manifests pour profiter du cache des deps
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Puis le reste du code
COPY . .

# Build statique (mysql driver est pure Go -> CGO=0 OK)
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w -buildid=" -o /out/cryptoviz-api ./api

### 2) Runtime stage (distroless = minimal + certs)
FROM gcr.io/distroless/base-debian12 AS runtime
WORKDIR /app

# Copie du binaire
COPY --from=build /out/cryptoviz-api /app/cryptoviz-api

# Variables par défaut (peuvent être surchargées au run)
ENV PORT=8080

# Expose le port HTTP
EXPOSE 8080

# Non-root pour la sécu
USER nonroot:nonroot

# Lancement
ENTRYPOINT ["/app/cryptoviz-api"]