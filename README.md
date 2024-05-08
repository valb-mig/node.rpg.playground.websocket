## 🤖 Websocket simples para minha aplicação [RPG - Playground]('https://github.com/valb-mig/nextjs.rpg.playground')

### Docker para testar o websocket em ambiente de teste

```docker build -t rpg_websocket .```

```docker run -p 4000:4000 rpg_websocket```

```docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' [id do container]```

