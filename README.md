Current version: **0.1.0**

# About
This allows you to fetch EPG data for linear streaming services such as Peacock and ABC, and transforms them so you can use them with [chrome-capture-for-channels](https://github.com/fancybits/chrome-capture-for-channels).

# Using
The server exposes 2 main endpoints:

| Endpoint | Description |
|---|---|
| /channels.m3u | The channel list you'll import into your client |
| /xmltv.xml | The schedule that you'll import into your client |

# Running
The recommended way of running is to pull the image from [Docker Hub](https://hub.docker.com/r/m0ngr31/ccEPG).

## Environment Variables
| Environment Variable | Description | Required? | Default |
|---|---|---|---|
| PUID | Current user ID. Use if you have permission issues. Needs to be combined with PGID. | No | - |
| PGID | Current group ID. Use if you have permission issues. Needs to be combined with PUID. | No | - |
| PORT | Port the API will be served on. You can set this if it conflicts with another service in your environment. | No | 8787 |

## Volumes
| Volume Name | Description | Required? |
|---|---|---|
| /app/config | Used to store DB and application state | Yes |


## Docker Run
By default, the easiest way to get running is:

```bash
docker run -p 8787:8787 -v config_dir:/app/config m0ngr31/ccEPG
```

If you run into permissions issues:

```bash
docker run -p 8787:8787 -v config_dir:/app/config -e PUID=$(id -u $USER) -e PGID=$(id -g $USER) m0ngr31/ccEPG
```
