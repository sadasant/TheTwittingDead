// sadasant :.~
// Go to http://sadasant.com/license.txt to read the license.

_ = {
  // Match: (origin,destiny)
  //   It will return the destiny with the origin values
  //   So the type of the return will be the type of the destiny
  //
  //
  // Example:
  //   _.Match({first:0,second:0,third:0},[1,2,3])
  //   
  // Returns:
  //   {first:1,second:2,third:2}
  //
  // Example:
  //   _.Match([1,2,3],{first:3,second:2,third:1})
  //   
  // Returns:
  //   [3,2,1]
  //
  Match: function(d,o){
    if(_.Typeof(o)!='Array'){
      var tmp = [];
      for(var key in o) tmp.push(o[key]);
      if(tmp[0]==undefined)
        for(var key=0;key<o.length;key++) tmp.push(o[key]);
      o = tmp;
    }
    var c=0;
    for(var key in d) d[key] = o[c++];
    return d;
  },

  // type: (value,value1,..valueX)
  //   It will return the true types of the values
  //
  // Example:
  //   _.Typeof([1,2,3])
  //   
  // Returns:
  //   'Array'
  //
  // Example:
  //   _.Typeof({first:1})
  //   
  // Returns:
  //   'object'
  //
  // Example:
  //   _.Typeof()
  //   
  // Returns:
  //   'null'
  //
  Typeof: function (value) {
    var s = typeof value;
    if(s === 'object')
      if (value) {
        if (value instanceof Array) {
           s = 'Array';
        }
        else if(value!=null) s = 'object';
      }
    return s;
  }

}
