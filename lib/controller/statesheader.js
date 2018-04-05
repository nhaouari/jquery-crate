require('jquery-qrcode');

function StatesHeader(model, statesView, linkView, shareView){
    var self = this;
    this.model = model;
    this.statesView = statesView;

    this.startSharingText = '<i class="fa fa-link fa-2x ficon2"></i>';
    this.startSharingTooltip = 'start sharing';
    this.stopSharingText = '<i class="fa fa-unlink fa-2x ficon2"></i>';
    this.stopSharingTooltip = 'stop sharing';
    

    model.rps.on("statechange", function(state){
        switch (state){
        case 'connected': statesView.setNetworkState('connected'); break;
        case 'partially connected': statesView.setNetworkState('partiallyConnected'); break;
        case 'disconnected': statesView.setNetworkState('disconnected'); break;
        };
    });
   
    shareView.click( function(){
        var socket, action, client;
        if (model.signaling.startedSocket){
            model.signaling.stopSharing();
            return ; // ugly as hell
        };
        // #0 create the proper call to the server
        socket = model.signaling.startSharing();
        statesView.setSignalingState("waitSignaling");
        
        socket.on("connect", function(){
            shareView.removeAttr("disabled");
            statesView.setSignalingState("waitJoiners");
            shareView.html(self.stopSharingText);
            shareView.attr('title', self.stopSharingTooltip)
                .tooltip('fixTitle');
        });
        socket.on("disconnect", function(){
            shareView.html(self.startSharingText);
            shareView.attr('title', self.startSharingTooltip)
                .tooltip('fixTitle');
            jQuery("#linkContainer").hide();
        });
        shareView.attr("disabled","disabled");
        // #1 modify the view
        // #A clean the address from args
        if (model.signaling.startedSocket){
            // #B add the new argument
            var address = (window.location.href).split('?')[0];
            action = linkView.printLink(address +"?"+
                                        model.signalingOptions.session);
        };        
    });


    linkView.qrcode.click(function(){
        var address = (window.location.href).split('?')[0];
        address = address + "?" + model.signalingOptions.session;
        linkView.qrcodeCanvas.html("");
        linkView.qrcodeCanvas.qrcode({
            size:400,
            text:address
        });
    });    
};

StatesHeader.prototype.startJoining = function(signalingOptions){
    var socket = this.model.signaling.startJoining(signalingOptions);
    this.statesView.setSignalingState('waitSignaling');
    
    var self = this;
    socket.on('connect',
              function(){ self.statesView.setSignalingState('waitSharer'); });
};

module.exports = StatesHeader;
