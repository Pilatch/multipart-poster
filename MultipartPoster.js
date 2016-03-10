;(function () {
  "use strict"
  var request = require("request")
  var fs = require("fs")

  function setRequestOptions(poster, url, requestOptions) {
    requestOptions = requestOptions || {}
    requestOptions.url = url
    Object.keys(poster.requestOptions).forEach(function (key) { //sprinkle in the default requestOptions
      if (typeof requestOptions[key] === "undefined") {
        requestOptions[key] = poster.requestOptions[key]
      }
    })
    return requestOptions
  }

  function handleBooleanParameter(poster, key, parameterValue) {
    switch (poster.parameterOptions.handleBoolean) {
    case MultipartPoster.symbols.THROW_ERROR:
      poster.error = ("Illegal Boolean parameter value for key \"" + key + "\": " + parameterValue)
      throw new Error()
    case MultipartPoster.symbols.BLANK_STRING:
      return ""
    case MultipartPoster.symbols.NULL_STRING:
      return "null"
    case MultipartPoster.symbols.BOOLEAN_STRING:
      return new Boolean(parameterValue).toString()
    case MultipartPoster.symbols.BINARY:
      return parameterValue ? "1" : "0"
    case MultipartPoster.symbols.SKIP:
      return //returning undefined
    default:
      throw "Unsupported value for parameterOptions.handleBoolean " + poster.parameterOptions.handleBoolean
    }
  }

  function handleUndefinedParameter(poster, key) {
    switch (poster.parameterOptions.handleUndefined) {
    case MultipartPoster.symbols.THROW_ERROR:
      poster.error = "Illegal undefined parameter value for key \"" + key + "\""
      throw new Error()
    case MultipartPoster.symbols.BLANK_STRING:
      return ""
    case MultipartPoster.symbols.NULL_STRING:
      return "null"
    case MultipartPoster.symbols.BOOLEAN_STRING:
      return "false"
    case MultipartPoster.symbols.BINARY:
      return "0"
    case MultipartPoster.symbols.SKIP:
      return //returning undefined
    default:
      throw "Unsupported value for parameterOptions.handleUndefined " + poster.parameterOptions.handleUndefined
    }
  }

  function handleNullParameter(poster, key) {
    switch (poster.parameterOptions.handleNull) {
    case MultipartPoster.symbols.THROW_ERROR:
      poster.error = "Illegal null parameter value for key \"" + key + "\""
      throw new Error()
    case MultipartPoster.symbols.BLANK_STRING:
      return ""
    case MultipartPoster.symbols.NULL_STRING:
      return "null"
    case MultipartPoster.symbols.BOOLEAN_STRING:
      return "false"
    case MultipartPoster.symbols.BINARY:
      return "0"
    case MultipartPoster.symbols.SKIP:
      return //returning undefined
    default:
      throw "Unsupported value for parameterOptions.handleNull " + poster.parameterOptions.handleNull
    }
  }

  function convertNonArrayParameterValueByType(poster, key, parameterValue) {
    switch (typeof parameterValue) {
    case "boolean":
      return handleBooleanParameter(poster, key, parameterValue)
    case "undefined":
      return handleUndefinedParameter(poster, key)
    }
    if (parameterValue === null) {
      return handleNullParameter(poster, key)
    }
    return parameterValue
  }

  function setParameters(poster, form, formData) {
    var arrayParametersToAppend = []

    Object.keys(poster.files).forEach(function (key) { //strap the files onto the formData
      var fileParameter = poster.files[key]

      if ( Array.isArray(fileParameter) ) {
        formData[key] = fileParameter.map(function (filePath) {
          return fs.createReadStream(filePath)
        })
      } else {
        formData[key] = fs.createReadStream( fileParameter )
      }
    })
    Object.keys(formData).forEach(function (key) {
      var parameterValue = formData[key]

      if ( Array.isArray(parameterValue) ) {
        arrayParametersToAppend.push(key)
      } else {
        parameterValue = convertNonArrayParameterValueByType(poster, key, parameterValue)
        if (typeof parameterValue !== "undefined") {
          form.append(key, parameterValue)
        }
      }
    })
    arrayParametersToAppend.forEach(function (key) {
      formData[key].forEach(function (value) {
        if (poster.parameterOptions.bracketArrayParameterNames) {
          form.append(key + "[]", value)
        } else {
          form.append(key, value)
        }
      })
    })
  }
    
  function MultipartPoster() {
    this.parameterOptions = {} //can override what we're about to get from the class level
    Object.keys(MultipartPoster.parameterOptions).forEach(function (parameterOption) {
      this.parameterOptions[parameterOption] = MultipartPoster.parameterOptions[parameterOption]
    }, this)

    this.error = null //because request will eat what we throw, examine the error here

    this.files = {} //In the form of parameterName: filePath or parameterName: [filePath1, filePath2, ...]

    this.requestOptions = {  //can be overridden by passing the requestOptions parameter to post()
      encoding: null, //expect a Buffer as the response body for consistency
      method: "POST"
    }

    this.addFile = function addFile(parameterKey, filePath) {
      var recursiveArguments

      if (typeof this.files[parameterKey] === "undefined" ) {
        this.files[parameterKey] = filePath
      } else if ( Array.isArray(this.files[parameterKey]) ) {
        this.files[parameterKey].push(filePath)
      } else {
        this.files[parameterKey] = [ this.files[parameterKey], filePath ]
      }
      if (arguments.length <= 2) {
        return this
      }
      recursiveArguments = Array.prototype.splice.call(arguments, 2)
      recursiveArguments.unshift(parameterKey)
      return this.addFile.apply(this, recursiveArguments)
    }

    //formData accepts readStreams for files
    //responseHandler is optional, and passed: error, response, body
    //requestOptions is optional. No pun intended
    this.post = function (url, formData, responseHandler, requestOptions) {
      var postRequest

      if (typeof arguments[1] === "function" && typeof arguments[2] !== "function") { //then the user is not using the formData parameter
        formData = {}
        responseHandler = arguments[1]
        requestOptions = arguments[2]
      }
      if (!formData) {
        formData = {}
      }
      if (!responseHandler) {
        responseHandler = function () {}
      }
      postRequest = request( setRequestOptions(this, url, requestOptions), responseHandler )
      setParameters(this, postRequest.form(), formData)
      postRequest.on("error", function (error) {
        error.info = {
          parameterOptions: this.parameterOptions,
          requestOptions: requestOptions
        }
        responseHandler(error)
      })
      return postRequest
    }

    this.send = this.post //alias in case you're not POSTing, and semantics are important

  }

  MultipartPoster.symbols = {
    THROW_ERROR: 0,
    BLANK_STRING: 1,
    NULL_STRING: 2,
    BOOLEAN_STRING: 3,
    BINARY: 4,
    SKIP: 5
  }

  MultipartPoster.post = function () {
    var poster = new MultipartPoster()

    return poster.post.apply( poster, Array.prototype.slice.call(arguments, 0) )
  }

  MultipartPoster.addFile = function () {
    var poster = new MultipartPoster()

    return poster.addFile.apply( poster, Array.prototype.slice.call(arguments, 0) )
  }

  MultipartPoster.send = MultipartPoster.post //same alias as on instance variables, again for semantics

  MultipartPoster.parameterOptions = {
    bracketArrayParameterNames: true,
    //true means that when posting an array of values, the generated parameters will look like "car[]=Tesla&car[]=Fisker"
    //false means it will instead look like "car=Tesla&key=Fisker"
    handleBoolean: MultipartPoster.symbols.BOOLEAN_STRING,
    //how Boolean values in FormData are handled
    handleNull: MultipartPoster.symbols.THROW_ERROR,
    //how null values in formData are handled
    handleUndefined: MultipartPoster.symbols.THROW_ERROR
    //how undefined values in formData are handled
  }

  module.exports = MultipartPoster
})()
