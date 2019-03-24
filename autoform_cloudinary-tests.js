// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by ipstas-autoform-cloudinary.js.
import { name as packageName } from "meteor/ipstas-autoform-cloudinary";

// Write your tests here!
// Here is an example.
Tinytest.add('ipstas-autoform-cloudinary - example', function (test) {
  test.equal(packageName, "ipstas-autoform-cloudinary");
});
