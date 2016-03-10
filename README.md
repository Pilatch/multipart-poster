# multipart-poster
Node utility to easily POST multipart forms, including files.

Yes, you could use [request](https://www.npmjs.com/package/request) for the same purpose, but it's verbose and has some gotchas. We take the pain out of posting multipart forms by automatically converting Booleans, adding brackets to array parameter names (by default), creating read streams for files, and jumping through all the hoops in the right order to get your form data and files successfully sent.

## Usage

    var MultipartPoster = require("multipart-poster")

This gives you a class. You can construct instances of it that may behave differently from each other. To be more terse, call static methods `MultipartPoster.addFile` and `MultipartPoster.post`.

## Examples

Upload a cat picture

    var url = "http://example.com/kitten-image-uploads"
    
    MultipartPoster.addFile("kittenImage", "Mittens-first-hairball.gif").post(url)

Explore new foods

    MultipartPoster
    .post("http://example.com/food-suggestions", {
      dishesILike: ["Potatoes Au Gratin", "Yogurt and Honey", "Ice Cream Sandwich"],
      vegan: false,
      vegetarian: true
    }, function (error, response, body) {
      console.log( "More foods I might like to try:", body.toString("utf8") )
    })

Apply for a high-powered job

    var url = "https://example.com/job-applications"
    var formData = {
      positionDesired: "emperor",
      firstName: "Marcus",
      lastName: "Aurelius",
      phoneNumber: "N/A",
      emailAddress: "N/A",
      preferredMethodsOfContact: "ouija board, spiritual medium",
      expectedCompensation: "human souls"
    }
    var poster = new MultipartPoster()
    var postRequest

    poster
      .addFile("resume", "My Resume.docx")
      .addFile("coverLetter", "why choose an undead emperor.txt")
      .addFile("recommendations", "Hierocles-rec.txt", "Fronto-rec.rtf", "Cassius Dio-rec.md")
    postRequest = poster.post(url, formData)
    postRequest.on("response", function (response) {
      console.log("Job application upload response status: ", response.statusCode)
    })

## MultipartPoster methods

### addFile

Adds any number of files you want, all with the same parameter name, which you specify as the first argument.

Returns a MultipartPoster instance for method chaining.

    var poster1 = new MultipartPoster()
    
    poster1
      .addFile(parameterName, filePath1 [, filePath2 [...]])
      .addFile(anotherParameterName, anotherFilePath)

or

    var poster2 = MultipartPoster.addFile(/* same argument signatures */)

### post

Send some data somewhere, and return the request object, which is [a stream that's returned by the request utility](https://www.npmjs.com/package/request#streaming).

Has two argument signatures.

    var poster1 = new MultipartPoster()
    var poster2 = new MultipartPoster()

    poster1.post(url [, formData [, responseHandler [, requestOptions]]])
    poster2.post(url [, responseHandler [, requestOptions]])

or

    MultipartPoster.post(/* same argument signatures */)

#### Arguments:

##### url

(required)

The destination for your data.

##### formData

(optional)

A plain old JavaScript object. Its key/value pairs become the POST parameter names/values, respectively. Values could be strings, numbers, Booleans, arrays.

If you are only sending files, and have used `.addFile` previously, then you do not need to specify `formData`.

Should you want to use formData to send files, then make the value of each POST parameter that's a file a `stream.Readable`, e.g. via [`fs.createReadStream("path/to/file.whatever")`](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)

If you need more control over form data, then create this object [the way the request module expects](https://www.npmjs.com/package/request#forms).

##### responseHandler

(optional)

A function to call upon receiving a response. It will be called asynchronously, and passed three arguments in this order: `error`, `response`, `body`. If `error` isn't `null`, something went wrong. `response` is the response object, and `body` is everything following the response headers, as a [`Buffer`](https://nodejs.org/api/buffer.html) by default because `null` is the default `encoding` in `requestOptions`, below.

##### requestOptions

(optional)

[Options as specified in the request documentation.](https://www.npmjs.com/package/request#requestoptions-callback)

Defaults to:

    { encoding: null, method: "POST" }

### send

An alias for `post` purely for semantics, in case you want to PUT your form instead of POSTing it.

    var putter = new MultipartPoster()

    putter.requestOptions.method = "PUT"
    putter.send(/* same request signature as post */)

## MultipartPoster instance properties

### error

Should be `null` unless something went wrong. Then it may store a meaningful message if our code was able to detect the problem.

### parameterOptions

Inherits initial properties from the class-level at `MultipartPoster.parameterOptions`. You can override them at the instance-level.

See [Technical Stuff](#technical-stuff) below for more detail.

### requestOptions

Same as the [requestOptions](#requestoptions) argument to the post method.

### files

Calls to [addFile](#addfile) populate this object, but you can change it manually too. It's a plain old JavaScript object that could look like 

    {
      parameterName1: filePath,
      parameterName2: [filePath1, filePath2, ...],
      ...
    }

## Technical Stuff

### Array parameters

Some applications expect a POST parameter with an array of values to look like:

    colors=blue&colors=red&colors=purple

While others expect:

    colors[]=blue&colors[]=red&colors[]=purple

We default to the latter, with brackets. Should you want to change that, turn off the `bracketArrayParameterNames` parameter option, like so:

      var formData = { colors: ["red", "blue", "purple"] }
      var poster = new MultipartPoster()

      poster.parameterOptions.bracketArrayParameterNames = false
      poster.post(/* ... */)

The above will only affect that one instance, `poster`. To change this setting for every `MultipartPoster`, change the setting at the class-level.

    MultipartPoster.parameterOptions.bracketArrayParameterNames = false

### Undefined and Null form parameters

If you try to post parameters with values that are `null` or `undefined` then MultipartPoster will throw an error by default. To change that behavior, choose how you want parameters like that to be converted. For instance, if you want `undefined` values to be posted as blank strings, then write:

    MultipartPoster.parameterOptions.handleUndefined = MultipartPoster.symbols.BLANK_STRING

Should you want parameters with `null` values to not be sent at all, then do this:

    MultipartPoster.parameterOptions.handleNull = MultipartPoster.symbols.SKIP

### Boolean form parameters

To have `true` and `false` parameter values converted to `1` and `0` respectively:

    MultipartPoster.parameterOptions.handleBoolean = MultipartPoster.symbols.BINARY

### Parameter conversion

Your parameter conversion behavior options within the `MultipartPoster.symbols` namespace are: `THROW_ERROR`, `BLANK_STRING`, `NULL_STRING`, `BOOLEAN_STRING`, `BINARY`, `SKIP`.

#### Class vs. Instance level

These settings will affect how every MultipartPoster instance will behave. For more granular control, construct an instance and set its parameter options to override those taken from the class-level.

In this example, we regress to the behavior exhibited by the [request module](https://www.npmjs.com/package/request) when encountering a Boolean parameter value.

    var poster = new MultipartPoster()

    poster.parameterOptions.handleBoolean = MultipartPoster.symbols.THROW_ERROR
    poster.post(/* ... */)

## Test Specifications

* Post strings and numbers (as strings) from a MultipartPoster instance.
* Post from a static method for convenience.
* Post strings and files.
* Post a file without directly specifying to create a read stream.
* Only post a file.
* Return a stream when posting.
* Convert boolean parameter values to strings by default.
* Post simple arrays.
* Post simple arrays without brackets after parameter names, if desired.
* Post files in an array.
* Post files in an array via one call to the addFile method.
* Post files in an array via multiple calls to the addFile method.
* Handle Boolean values in formData as specified by the user.
* Throw an error if desired when encountering a Boolean parameter.
* Handle null values in formData as specified by the user.
* Throw an error if desired when encountering a null parameter.
* Handle undefined values in formData as specified by the user.
* Throw an error if desired when encountering an undefined parameter.
* Allow you to specify a method other than POST.
* PUT strings and files via the `.send` alias for `.post`, for semantics.
