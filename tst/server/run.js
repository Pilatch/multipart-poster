#!/usr/bin/env node
var express = require("express")
var app = express()
var port = require("./port.json")
var server

app.use( express.static(`${__dirname}/static/`) )
server = app.listen(port)

module.exports = {
  app: app,
  express: express,
  port: port,
  server: server
}
