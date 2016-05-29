/* global jQuery, io*/

var chatHandler = (function ($) {
    var socket;
    
    function connect(host, port) {
        if (!host || !port) {
            throw "cannot create a socket connection, host and port not defined";
        }
       var address = host+":"+port;
       try {
           socket = io.connect(address);
       } catch (error) {
           console.error(error);
       }
       
       if (socket !== undefined) {
        return socket;
       }
       return null;
   }
   
   function sendData (name, data, callback) {
       if (!data) {
           throw ("data not defined. Cannot send data to the server.");
       }
       if (callback) {
           var validatedData = callback(data);
           if(!validatedData){
               throw("validation failed. sending process aborted.");
           }
           _send(name, validatedData);
           return;
       }
       _send(name, data);
   }
   
   function _send(name, obj) {
        if(!socket) {
            throw ("Socket connection cannot be established");
        }
        socket.emit(name, obj);
   }
   
    /**
     * function that iterates over each key and sends the key value pair as an argument 
     * for the callback function passed, helpful for validation
     * @obj 
    */
    function validate(obj, fn) {
        var keys = Object.keys(obj);
        for(var i=0; i<keys.length;i++){
            var key = keys[i],
            value = obj[key];
            
            fn({
                key: key,
                value: value
            });
        }
    }
    
    //API to handle the status messages
    var statusMessage = (function () {
        var statusSelector,
            defaultStatus = "Idle",
            currentStatus = "";
        
        /**
         * function to set the status message
         * @param {string} msg message string to set
         */
        function setStatus(msg){
            statusSelector.text(msg);
            if (msg !== defaultStatus) {
                var delay = setTimeout(function(){
                    setStatus(defaultStatus);
                    clearInterval(delay);
                }, 3000);
            }
        }
        
        /*
        * function to get the status message from the server,
        * listens for the emitted socket name, and sets the status respective,
        * callback function for extending/passing more data as per needed
        * @param {string} name socket event to listen for
        * @param {function} cb callback function to call if the data sent has clear attribute
        */
        
        function getStatus(name, cb){
            if (!name){
                return;
            }
            socket.on(name, function (data){
                currentStatus = data;
                setStatus((typeof data === 'object') ? data.message : data);
                cb(data);
                
            });
        }
        
        return {
            /**
             * Initializer function, checks for the type of parameter passed and sets the selector,
             * if jquery is not found, falls back to native document.querySelector
             * @param {string|DOM object} selector jquery object or normal string
             * @return {Object} returns itself to support chaining
             */
             
            init: function (selector) {
                if (selector instanceof jQuery){
                    statusSelector = selector;
                    return this;
                }
                if (typeof selector === "string") {
                    if (typeof jQuery === 'undefined'){
                        statusSelector = document.querySelector(selector);
                    } else {
                        statusSelector = jQuery(selector);
                    }
                    return this;
                }
                
            },
            setStatus: setStatus,
            getStatus: getStatus
        }
        
    }());
    
   return {
       connect: connect,
       validate: validate,
       sendData: sendData,
       statusMessage: statusMessage
   };
    
}(jQuery));