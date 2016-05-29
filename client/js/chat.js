/* global $, chatHandler */

(function() {
    var connected = false,
        socket,
        selectors = {
            'chatInput' : $("#btn-input"),
            'sendButton': $("#btn-chat"),
            'chatName': $(".userName"),
            'status': $(".status-message span")
        };
        
    
    /**
     * private function that creates a singleton socket connection
     * @host String url to connect
     * @port Integer port to make connection
     * @return Boolean returns true if connection successful
     */
    function _getConnection (host, port) {
        
        var socketConnection = chatHandler.connect(host, port);
        if (socketConnection !== null){
            socket = socketConnection;
            connected = true;
            return true;
        }
    }
    
    /**
     * function closure for gathering data from the textboxes
     * gets chat message on keypress(enter key) makes minor validation and
     * emits the data to the server
     * Also handling the status messages
     */
    
    function model() {
        
        /**
         * gets the text from input textbox on pressing enter key without holding shift key
         */
        function _getChatMessage(){
            selectors.chatInput.keydown(function(event) {
                var self = $(this),
                name = selectors.chatName.val();
                
                if (event.which === 13 && event.shiftKey === false) {
                    var messageData = {
                        name : name,
                        message : self.val()
                    };
                    _sendData(messageData);
                }
            });
            
            selectors.sendButton.click(function (){
                var name = selectors.chatName.val();
                var msgData = {
                    name: name,
                    message: selectors.chatInput.val()
                };
                _sendData(msgData);
            });
        }
        
        /**
         * provides interface for validation and emits the data to the server 
         *@obj [Object] data object to validate and send
         */
        function _sendData(obj){
            var newObj = {};
            var data = chatHandler.validate(obj, function(objData){
                
                //handle error here, send custom message to user
                if (!objData.value){
                    
                    return false;
                }
                
                return objData;
            });
            if (data !== "undefined"){
                socket.emit("input", data);
            }
        }
        
        function init(){
            _getConnection("http://laurea-chat-meanishn.c9users.io", 8080);
            _getChatMessage();
        }
        
        return {
            init: init,
            
        };
    }
    
    function controller() {
        model().init();
        var template = '<div class="row msg_container base_recieve">'+
                                '<div class="col-md-2 col-xs-2 avatar">'+
                                    '<img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive ">'+
                                '</div>'+
                                '<div class="col-md-10 col-xs-10">'+
                                    '<div class="messages msg_sent">'+
                                        '<p>{{message}}</p>'+
                                        '<time style="color: #6CA4C8; font-size: 12px; font-weight: 900;">{{name}}</time>'+
                                    '</div>'+
                                '</div>'+
                                
                            '</div>';
                            
        function renderTemplate(html, data) {
            var str = html.replace("{{message}}", data[0].message)
            str = str.replace("{{name}}", data[0].name);
            return str;
        }
        
        socket.on("output", function (data){
            
           var rawHtml = renderTemplate(template, data);
           $(".panel-body").append(rawHtml);
           $(".panel-body").scrollTop($(".panel-body")[0].scrollHeight);
        });
        
        var statusHandler = chatHandler.statusMessage.init(selectors.status);
        statusHandler.getStatus("statusMessage", function(data){
            if (data.clear) {
                selectors.chatInput.val("");
            }
        });
        
        
    }
    
    
    controller();
}());