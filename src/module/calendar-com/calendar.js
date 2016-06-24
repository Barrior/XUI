//calendar.js
/*
API:
     //参数options 即 Calendar.configDefault
     $().calendarCom( timestamp );
     或者 $().calendarCom( timestamp, options );
     或者 $().calendarCom( options );

     //当日历显示出来之后
     $().on('shown.xui.calendar', function( ev ){
        console.log( ev )
        console.log( ev.calendar )
     })
     //当点击向前翻页后
     $().on('prev.xui.calendar', function( ev ){})
     //当点击向后翻页后
     $().on('next.xui.calendar', function( ev ){})
     //当日期被改变时被触发
     $().on('changeDay.xui.calendar', function( e, calendar ){})
 */
+function( $ ){
    'use strict';
    require(['css!module/calendar-com/calendar']);
    var template = '<div class="calendar-com"><header class="calendar-header pr"><a href="javascript:;" class="calendar-prev pa"><i class="icon icon-chevron-left"></i></a><a href="javascript:;" class="calendar-next pa"><i class="icon icon-chevron-right"></i></a><div class="calendar-date"></div></header><div class="calendar-body"><ul class="calendar-indi list-unstyled cf"></ul><ul class="calendar-list list-unstyled cf"></ul></div></div>';
    var extend = $.extend;

    function Calendar( container, options ){
        this.$container = $( container).empty();
        this.set = options;
        this.date = new Date( options.timestamp || Date.now() );
        this.thisYear = this.year = this.date.getFullYear();
        this.thisMonth = this.month = this.date.getMonth() + 1;
        this.thisDay = this.day = this.date.getDate();

        this.initDom();
        this.prev();
        this.next();
        this.dayclick();
    }

    function dayFormat( str ){
        return (str = '' + str).length > 1 ? str : ('0' + str);
    }

    function getWeekText( index ){
        return Calendar.language[ index ];
    }

    //先做部分API，其余到后面再补充
    Calendar.configDefault = {
        timestamp: null,
        format: 'yyyy-mm-dd hh:ii',
        //选择日期后自动关闭
        autoclose: false,
        //日期可点击
        dayclick: true
    };
    //这是一个很限制的language(ˇˍˇ)
    Calendar.language = ['一','二','三','四','五','六','日'];

    Calendar.prototype = {
        constructor: Calendar,
        initDom: function(){
            this.$calendar = $(template).appendTo( this.$container );
            this.appendIndicator();
            this.appendDay();
        },
        appendIndicator: function(){
            this.$calendar.find('.calendar-indi').append(
                Calendar.language.map(function( v ){
                    return '<li>'+ v +'</li>';
                }).join('')
            );
        },
        appendDay: function(){
            var $calendar = this.$calendar;
            var year = this.year;
            var month = this.month;
            var days = this.getDaysInMonth();
            //计算当月第一天是星期几
            var firstDayWeek = new Date( year +'-'+ month +'-1' ).getDay() || 7;
            //li总个数：实际天数 + 月的第一天之前的空格天数
            var count = days + firstDayWeek - 1;
            var dayDOM = [];

            for( var i = 0; i < count; i++ ){
                var day = i - firstDayWeek + 2;
                if( day > 0 ){
                    var dDate = year +'-'+ dayFormat( month ) +'-'+ dayFormat( day );
                    var dWeek = getWeekText( (new Date( dDate ).getDay() || 7) - 1 );
                    dayDOM.push(
                        '<li data-date="'+ dDate +'" data-week="'+ dWeek +'">'+ day +'</li>'
                    );
                }else{
                    dayDOM.push( '<li></li>' );
                }
            }

            $calendar.find('.calendar-date').text( year +'年'+ month +'月' );
            $calendar.find('.calendar-list').empty().append( dayDOM.join('') );

            if( year === this.thisYear &&
                month === this.thisMonth &&
                this.day === this.thisDay ){
                //eq,firstDayWeek都是从0计算，所以-2
                $calendar.find('.calendar-list li:eq('+( this.day + firstDayWeek - 2 )+')')
                    .addClass('active');
            }
        },
        pageTurn: function( name, callback ){
            var self = this;
            self.$calendar.find( '.calendar-' + name ).click(function(){
                if( self[ 'disabled' + name ] ){
                    return;
                }
                //处理不同的加减法
                callback.call( self );
                //绘制DOM
                self.appendDay();

                var ev = $.Event( name + '.xui.calendar' );
                ev.calendar = self;
                self.$calendar.trigger( ev );
            });
        },
        prev: function(){
            this.pageTurn( 'prev', function(){
                this.month--;
                if( this.month < 1 ){
                    this.month = 12;
                    this.year--;
                }
            });
        },
        next: function(){
            this.pageTurn( 'next', function(){
                this.month++;
                if( this.month > 12 ){
                    this.month = 1;
                    this.year++;
                }
            });
        },
        dayclick: function(){
            var self = this;
            var $list = this.$calendar.find('.calendar-list');
            if( this.set.dayclick ){
                $list.on('click.xui.calendar', '>li', function(){
                    if( $(this).attr('data-date') && !$(this).hasClass('active') ){
                        $list.find('>.active').removeClass('active');
                        $(this).addClass('active');

                        var ev = $.Event( 'changeDay.xui.calendar' );
                        ev.calendar = self;
                        self.$calendar.trigger( ev );
                    }
                });
            }
        },
        getDaysInMonth: function(){
            var year = this.year;
            var month = this.month;
            if( month !== 2 ){
                //1,3,5,7, 8,10,12 = 31
                //4,6, 9,11 = 30
                if( month < 8 && month % 2 === 0 || month >= 8 && month % 2 === 1 ){
                    return 30;
                }else{
                    return 31;
                }
            }
            //2月: 平年28，闰年29
            //每4年一闰，逢百年不润，逢400年时又需要再闰一天
            if( year % 4 === 0 && year % 100 !== 0 || year % 400 === 0 ){
                return 29;
            }
            return 28;
        }
    };

    function Plugin( timestamp, options ){
        if( typeof timestamp === 'number' ){
            timestamp = {
                timestamp: parseInt( timestamp )
            };
            if( typeof options === 'object' ){
                timestamp = extend( timestamp, options );
            }
            options = extend( {}, Calendar.configDefault, timestamp );
        }else if( typeof timestamp === 'object' ){
            options = extend( {}, Calendar.configDefault, timestamp );
        }else{
            options = Calendar.configDefault;
        }
        return this.each(function(){
            var $this = $(this);
            //预留data
            var data = $this.data('xui.calendar');

            if( !data ){
                $this.data( 'xui.calendar', ( data = new Calendar(this, options) ) );
            }
        });
    }

    $.fn.calendarCom = Plugin;
    $.fn.calendarCom.configDefault = Calendar.configDefault;
    $.fn.calendarCom.language = Calendar.language;
}(jQuery);