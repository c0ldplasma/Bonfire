# Bonfire - A web based chat client for twitch

Bonfire is a web based chat client for twitch chats. It is still under heavy development and not recommended for general use yet.

You can either use the website version under chats.c0ldplasma.de or download the deskop app based on electron under releases.


## 

## Deployment

## Built with

* [rollup.js](https://rollupjs.org/guide/en) - A module bundler for JavaScript.
* [Electron](https://electronjs.org/) - Build cross platform desktop apps with JavaScript, HTML, and CSS.

## Attributions

* [Fire icon](https://www.iconfinder.com/icons/116853/fire_icon) by [SmartIcons](https://www.iconfinder.com/iconeden) licensed under the [Creative Commons (Attribution 2.5 Generic)](https://creativecommons.org/licenses/by/2.5/legalcode) is used as the Bonfire app logo with the following modifications made: - Changed the color to purple. 


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## rollup-starter-app

This repo contains a bare-bones example of how to create an application using Rollup, including importing a module from `node_modules` and converting it from CommonJS.

*See also https://github.com/rollup/rollup-starter-lib*


### Getting started

Clone this repository and install its dependencies:

```bash
git clone https://github.com/rollup/rollup-starter-app
cd rollup-starter-app
npm install
```

The `public/index.html` file contains a `<script src='bundle.js'>` tag, which means we need to create `public/bundle.js`. The `rollup.config.js` file tells Rollup how to create this bundle, starting with `src/main.js` and including all its dependencies, including [date-fns](https://date-fns.org).

`npm run build` builds the application to `public/bundle.js`, along with a sourcemap file for debugging.

`npm start` launches a server, using [serve](https://github.com/zeit/serve). Navigate to [localhost:5000](http://localhost:5000).

`npm run watch` will continually rebuild the application as your source files change.

`npm run dev` will run `npm start` and `npm run watch` in parallel.
