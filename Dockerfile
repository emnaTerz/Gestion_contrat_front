# Étape 1 : Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Étape 2 : Servir Angular avec Nginx
FROM nginx:alpine

# Supprimer COMPLÈTEMENT le site par défaut
RUN rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/conf.d/default.conf

# Copier les fichiers Angular depuis le sous-dossier browser
COPY --from=build /app/dist/contratouktaw/browser/ /usr/share/nginx/html/

# Créer une configuration Nginx avec printf
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html index.htm;\n\
    \n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    \n\
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
    \n\
    error_page 404 /index.html;\n\
}' > /etc/nginx/conf.d/default.conf

# Vérifier la configuration
RUN nginx -t

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]