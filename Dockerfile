# Étape 1 : Build Angular
FROM node:20-bullseye AS build

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier tout le projet et builder Angular
COPY . .
RUN npm run build --prod

# Étape 2 : Servir Angular avec Nginx
FROM nginx:alpine

# Copier les fichiers compilés Angular
COPY --from=build /app/dist/gestion_contrat_front /usr/share/nginx/html

# Config Nginx pour Angular (SPA routing)
RUN echo 'server { \
    listen 4200; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    error_page 404 /index.html; \
}' > /etc/nginx/conf.d/default.conf

# Exposer le port 4200
EXPOSE 4200

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
