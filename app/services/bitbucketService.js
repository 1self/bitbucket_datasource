var _ = require('underscore');
var Q = require('q');
var moment = require('moment');

var btbktService = function(){

    var _filterEventsByLastSyncedDateTime = function(events,lastSyncedDateTime){
        var deferred = Q.defer();
        var filteredEvents = [];
        _.each(events,function(event){
          if(moment(event.created_on) > moment(lastSyncedDateTime.toISOString())){
            filteredEvents.push(event);
          }
        });
        deferred.resolve(filteredEvents);
        return deferred.promise;
    }

    var _sortEvents=function(events){
       var deferred = Q.defer();
       sortedArray =  _.sortBy(events, function(event){return event.eventDateTime}).reverse()
       deferred.resolve(sortedArray);
       return deferred.promise;
    }

    return{
        filterEventsByLastSyncedDateTime:_filterEventsByLastSyncedDateTime,
        sortEvents : _sortEvents
    }
}();

module.exports = btbktService;