;(function () {
  "use strict"
  var expect = require("chai").expect
  var MultipartPoster = require("../../MultipartPoster")
  var run = require("../server/run.js")
  var multiparty = require("multiparty")
  var app = run.app
  var fs = require("fs")
  var serviceBase = `http://127.0.0.1:${run.port}`
  var dontCareDone //a poster may not care that the response comes back, but our unit test will!

  function noop() {}

  app.get("/method", (req, res) => {
    expect(req.query.foo).to.equal("bar")
    res.send("GET method")
    res.end()
  })

  app.post("/multiparty", (req, res) => {
    var form = new multiparty.Form()

    form.parse(req, (error, fields, files) => {
      expect(error).to.be.null
      expect( fields.key[0] ).to.equal("value")
      expect( fields.anotherKey[0] ).to.equal("anotherValue")
      expect( fields.foo[0] ).to.equal("22")
      expect(files).to.eql({})
      res.end()
    })
  })

  app.post("/skip", (req, res) => {
    var form = new multiparty.Form()

    form.parse(req, (error, fields, files) => {
      expect(error).to.be.null
      expect( fields.foo[0] ).to.equal("FOO")
      expect(fields.nil).to.be.undefined
      expect(fields.undie).to.be.undefined
      expect(fields.boole).to.be.undefined
      expect(files).to.eql({})
      res.end()
    })
  })

  app.post("/boolean", (req, res) => {
    var form = new multiparty.Form()

    form.parse(req, (error, fields, files) => {
      expect(error).to.be.null
      expect(files).to.eql({})
      expect(fields.yes[0]).to.equal("true")
      expect(fields.no[0]).to.equal("false")
      expect(fields.zero[0]).to.equal("0")
      expect(fields.one[0]).to.equal("1")
      res.end()
    })
  })

  app.post("/foo-is-expected-to-be", (req, res) => {
    var form = new multiparty.Form()

    form.parse(req, (error, fields, files) => {
      expect(error).to.be.null
      expect( Object.keys(fields).length ).to.equal(2)
      expect( fields.foo[0] ).to.equal( fields.fooExpectation[0] )
      expect( Object.keys(files).length ).to.equal(0)
      res.end()
    })
  })

  app.post("/text", (req, res) => {
    var form = new multiparty.Form()
    
    form.parse(req, (error, fields, files) => {
      var textFileObject = files.text[0]

      expect(error).to.be.null
      expect( Object.keys(fields).length ).to.equal(2)
      expect( fields.string1[0] ).to.equal("...and string2")
      expect( fields.jo[0] ).to.equal("MOMMA")
      expect( Object.keys(files).length ).to.equal(1)
      expect(typeof textFileObject).to.equal("object")
      expect(textFileObject.originalFilename).to.equal("postMultipart-post-me.txt")
      expect(textFileObject.fieldName).to.equal("text")
      expect( textFileObject.headers["content-type"] ).to.equal("text/plain")
      res.end()
    })
  })

  app.put("/text", (req, res) => {
    var form = new multiparty.Form()
    
    form.parse(req, (error, fields, files) => {
      var textFileObject = files.text[0]

      expect(error).to.be.null
      expect( Object.keys(fields).length ).to.equal(2)
      expect( fields.string1[0] ).to.equal("...and string2")
      expect( fields.jo[0] ).to.equal("MOMMA's mamma")
      expect( Object.keys(files).length ).to.equal(1)
      expect(typeof textFileObject).to.equal("object")
      expect(textFileObject.originalFilename).to.equal("postMultipart-post-me.txt")
      expect(textFileObject.fieldName).to.equal("text")
      expect( textFileObject.headers["content-type"] ).to.equal("text/plain")
      res.end()
    })
  })

  app.post("/only-a-file", (req, res) => {
    var form = new multiparty.Form()
    
    form.parse(req, (error, fields, files) => {
      var textFileObject = files.text[0]

      expect(error).to.be.null
      expect( Object.keys(fields).length ).to.equal(0)
      expect( Object.keys(files).length ).to.equal(1)
      expect(typeof textFileObject).to.equal("object")
      expect(textFileObject.originalFilename).to.equal("postMultipart-post-me.txt")
      expect(textFileObject.fieldName).to.equal("text")
      expect( textFileObject.headers["content-type"] ).to.equal("text/plain")
      res.end()
    })
  })

  app.post("/simpleArray", (req, res) => {
    var form = new multiparty.Form()

    form.parse(req, (error, fields, files) => {
      expect(error).to.be.null
      expect(fields).to.eql( { "carMakers[]": [ "Audi", "BMW", "Chysler", "Dodge", "Eagle", "Ford", "GM", "Honda" ] } )
      expect(files).to.eql({})
      res.end()
    })
  })

  app.post("/simpleArrayWithoutBrackets", (req, res) => {
    var form = new multiparty.Form()

    form.parse(req, (error, fields, files) => {
      expect(error).to.be.null
      expect(fields).to.eql( { "carMakers": [ "Audi", "BMW", "Chysler", "Dodge", "Eagle", "Ford", "GM", "Honda" ] } )
      expect(files).to.eql({})
      res.end()
    })
  })

  app.post("/filesArray", (req, res) => {
    var form = new multiparty.Form()

    form.parse(req, (error, fields, files) => {
      expect(error).to.be.null
      expect(fields.twentyTwo[0]).to.equal("22")
      expect(files["fylez[]"].length).to.equal(2)
      expect(files["fylez[]"][0].originalFilename).to.equal("postMultipart-post-me.txt")
      expect(files["fylez[]"][1].originalFilename).to.equal("foo.html")
      res.end()
    })
  })

  app.post("/dont-care-about-response", (req, res) => {
    var form = new multiparty.Form()
    
    form.parse(req, (error, fields, files) => {
      var textFileObject = files.text[0]

      expect(error).to.be.null
      expect( Object.keys(fields).length ).to.equal(2)
      expect( fields.string1[0] ).to.equal("...and string2")
      expect( fields.jo[0] ).to.equal("MOMMA")
      expect( Object.keys(files).length ).to.equal(1)
      expect(typeof textFileObject).to.equal("object")
      expect(textFileObject.originalFilename).to.equal("postMultipart-post-me.txt")
      expect(textFileObject.fieldName).to.equal("text")
      expect( textFileObject.headers["content-type"] ).to.equal("text/plain")
      res.end()
      dontCareDone()
    })
  })

  process.chdir(__dirname)
  describe("MultipartPoster", () => {
    it("should post strings and numbers (as strings) from instance", done => {
      var formData = {
        key: "value",
        anotherKey: "anotherValue",
        foo: 22
      }

      new MultipartPoster().post(`${serviceBase}/multiparty`, formData, done)
    })
    it("should post from a static method for convenience", done => {
      var formData = {
        key: "value",
        anotherKey: "anotherValue",
        foo: 22
      }

      MultipartPoster.post(`${serviceBase}/multiparty`, formData, done)
    })
    it("should post strings and files", done => {
      var formData = {
        string1: "...and string2",
        jo: "MOMMA",
        text: fs.createReadStream("../server/static/postMultipart-post-me.txt")
      }

      new MultipartPoster().post(`${serviceBase}/text`, formData, done)
    })
    it("should post a file without directly specifying to create a read stream", done => {
      var formData = {
        string1: "...and string2",
        jo: "MOMMA"
      }
      var poster = new MultipartPoster()

      poster
        .addFile("text", "../server/static/postMultipart-post-me.txt")
        .post(`${serviceBase}/text`, formData, done)
    })
    it("should only post a file", done => {
      new MultipartPoster()
        .addFile("text", "../server/static/postMultipart-post-me.txt")
        .post(`${serviceBase}/only-a-file`, done)
    })
    it("return a stream when posting", done => {
      MultipartPoster
        .addFile("text", "../server/static/postMultipart-post-me.txt")
        .post(`${serviceBase}/only-a-file`)
        .on("response", function (response) {
          expect(response.statusCode).to.equal(200)
          done()
        })
    })
    it("should convert boolean parameter values to strings by default", done => {
      var formData = {
        yes: true,
        no: false,
        zero: 0,
        one: 1
      }

      new MultipartPoster().post(`${serviceBase}/boolean`, formData, done)
    })
    it("should not care about the response if you don't", done => {
      var formData = {
        string1: "...and string2",
        jo: "MOMMA"
      }
      var poster = new MultipartPoster()

      dontCareDone = done
      poster
        .addFile("text", "../server/static/postMultipart-post-me.txt")
        .post(`${serviceBase}/dont-care-about-response`, formData)
    })
    it("should post simple arrays", done => {
      var formData = {
        carMakers: "Audi,BMW,Chysler,Dodge,Eagle,Ford,GM,Honda".split(",")
      }

      new MultipartPoster().post(`${serviceBase}/simpleArray`, formData, done)
    })
    it("should post simple arrays without brackets after parameter names, if desired", done => {
      var formData = {
        carMakers: "Audi,BMW,Chysler,Dodge,Eagle,Ford,GM,Honda".split(",")
      }
      var poster = new MultipartPoster()

      poster.parameterOptions.bracketArrayParameterNames = false
      poster.post(`${serviceBase}/simpleArrayWithoutBrackets`, formData, done)
    })
    it("should post files in an array", done => {
      var formData = {
        twentyTwo: 22,
        fylez: [
          fs.createReadStream("../server/static/postMultipart-post-me.txt"),
          fs.createReadStream("../server/static/foo.html")
        ]
      }
      var poster = new MultipartPoster()

      poster.parameterOptions.bracketArrayParameterNames = true
      poster.post(`${serviceBase}/filesArray`, formData, done)
    })
    it("should post files in an array via one call to the addFile method", done => {
      var formData = {
        twentyTwo: 22
      }
      var poster = new MultipartPoster()

      poster.parameterOptions.bracketArrayParameterNames = true
      poster
        .addFile("fylez", "../server/static/postMultipart-post-me.txt", "../server/static/foo.html")
        .post(`${serviceBase}/filesArray`, formData, done)
    })
    it("should post files in an array via multiple calls to the addFile method", done => {
      var formData = {
        twentyTwo: 22
      }
      var poster = new MultipartPoster()

      poster.parameterOptions.bracketArrayParameterNames = true
      poster
        .addFile("fylez", "../server/static/postMultipart-post-me.txt")
        .addFile("fylez", "../server/static/foo.html")
        .post(`${serviceBase}/filesArray`, formData, done)
    })
    it("should handle Boolean values in formData as specified by the user", done => {
      var endPoint = `${serviceBase}/foo-is-expected-to-be`
      var numDone = 0
      var numTests = 0
      var behaviorsToTest = "BLANK_STRING,NULL_STRING,BINARY".split(",")
      var posters = {}

      behaviorsToTest.forEach(function (behaviorSymbolName) {
        posters[behaviorSymbolName] = new MultipartPoster()
        posters[behaviorSymbolName].parameterOptions.handleBoolean = MultipartPoster.symbols[behaviorSymbolName]
      })
      function oneIsDone() {
        numDone++
        if (numDone === numTests) done()
      }

      posters.BLANK_STRING.post(endPoint, {
        foo: true,
        fooExpectation: ""
      }, oneIsDone)
      numTests++
      posters.NULL_STRING.post(endPoint, {
        foo: true,
        fooExpectation: "null"
      }, oneIsDone)
      numTests++
      posters.NULL_STRING.post(endPoint, {
        foo: false,
        fooExpectation: "null"
      }, oneIsDone)
      numTests++
      posters.BINARY.post(endPoint, {
        foo: true,
        fooExpectation: "1"
      }, oneIsDone)
      numTests++
      posters.BINARY.post(endPoint, {
        foo: false,
        fooExpectation: "0"
      }, oneIsDone)
      numTests++
    })
    it("should throw an error if desired when encountering a Boolean parameter", () => {
      var poster = new MultipartPoster()

      poster.parameterOptions.handleBoolean = MultipartPoster.symbols.THROW_ERROR
      expect(function () {
        poster.post(`${serviceBase}/foo-is-expected-to-be`, {
          foo: true,
          fooExpectation: "A giant bowl of Jose Tejas gumbo. Rice on the side."
        }, noop)
      }).to.throw(Error)
      expect(poster.error).to.equal("Illegal Boolean parameter value for key \"foo\": true")
    })
    it("should handle null values in formData as specified by the user", done => {
      var endPoint = `${serviceBase}/foo-is-expected-to-be`
      var numDone = 0
      var numTests = 0
      var behaviorsToTest = "BLANK_STRING,NULL_STRING,BINARY".split(",")
      var posters = {}

      behaviorsToTest.forEach(function (behaviorSymbolName) {
        posters[behaviorSymbolName] = new MultipartPoster()
        posters[behaviorSymbolName].parameterOptions.handleNull = MultipartPoster.symbols[behaviorSymbolName]
      })
      function oneIsDone() {
        numDone++
        if (numDone === numTests) done()
      }

      posters.BLANK_STRING.post(endPoint, {
        foo: null,
        fooExpectation: ""
      }, oneIsDone)
      numTests++
      posters.NULL_STRING.post(endPoint, {
        foo: null,
        fooExpectation: "null"
      }, oneIsDone)
      numTests++
      posters.BINARY.post(endPoint, {
        foo: null,
        fooExpectation: "0"
      }, oneIsDone)
      numTests++
    })
    it("should throw an error if desired when encountering a null parameter", () => {
      var poster = new MultipartPoster()

      poster.parameterOptions.handleNull = MultipartPoster.symbols.THROW_ERROR
      expect(function () {
        poster.post(`${serviceBase}/foo-is-expected-to-be`, {
          foo: null,
          fooExpectation: "A giant bowl of Jose Tejas gumbo. Rice on the side."
        }, noop)
      }).to.throw(Error)
      expect(poster.error).to.equal("Illegal null parameter value for key \"foo\"")
    })
    it("should handle undefined values in formData as specified by the user", done => {
      var endPoint = `${serviceBase}/foo-is-expected-to-be`
      var numDone = 0
      var numTests = 3
      var behaviorsToTest = "BLANK_STRING,NULL_STRING,BINARY".split(",")
      var posters = {}

      behaviorsToTest.forEach(function (behaviorSymbolName) {
        posters[behaviorSymbolName] = new MultipartPoster()
        posters[behaviorSymbolName].parameterOptions.handleUndefined = MultipartPoster.symbols[behaviorSymbolName]
      })
      function oneIsDone() {
        numDone++
        if (numDone === numTests) done()
      }

      posters.BLANK_STRING.post(endPoint, {
        foo: noop(),
        fooExpectation: ""
      }, oneIsDone)
      posters.NULL_STRING.post(endPoint, {
        foo: noop(),
        fooExpectation: "null"
      }, oneIsDone)
      posters.BINARY.post(endPoint, {
        foo: noop(),
        fooExpectation: "0"
      }, oneIsDone)
    })
    it("should skip sending certain parameters if desired", done => {
      var poster = new MultipartPoster()
      var formData = {
        foo: "FOO",
        nil: null,
        undie: noop(),
        boole: true
      }

      poster.parameterOptions.handleUndefined = MultipartPoster.symbols.SKIP
      poster.parameterOptions.handleBoolean = MultipartPoster.symbols.SKIP
      poster.parameterOptions.handleNull = MultipartPoster.symbols.SKIP
      poster.post(`${serviceBase}/skip`, formData, done)
    })
    it("should throw an error if desired when encountering an undefined parameter", () => {
      var poster = new MultipartPoster()

      poster.parameterOptions.handleUndefined = MultipartPoster.symbols.THROW_ERROR
      expect(function () {
        poster.post(`${serviceBase}/foo-is-expected-to-be`, {
          foo: noop(),
          fooExpectation: "A giant bowl of Jose Tejas gumbo. Rice on the side."
        }, noop)
      }).to.throw(Error)
      expect(poster.error).to.equal("Illegal undefined parameter value for key \"foo\"")
    })
    it("should allow you to specify a method other than POST", done => {
      var poster = new MultipartPoster()

      poster.send(`${serviceBase}/method?foo=bar`, (error, response, body) => {
        expect(error).to.be.null
        expect( body.toString("utf8") ).to.equal("GET method")
        done()
      }, { method: "GET" })
    })
    it("should PUT strings and files via the \".send\" alias for .post, for semantics", done => {
      var formData = {
        string1: "...and string2",
        jo: "MOMMA's mamma",
        text: fs.createReadStream("../server/static/postMultipart-post-me.txt")
      }
      var putter = new MultipartPoster()

      putter.requestOptions.method = "PUT"
      putter.send(`${serviceBase}/text`, formData, done)
    })
  })

})()
