/**
 * date_selector component displays a formatted date/time selector

 * ## Usage
 * ### Simple 
 * <code><|{value}|date_selector|></code>
 * ### Advanced 
 * <code><|{value}|date_selector|not with_time|></code>
 * <br>or with properties<br>
 * <code><|{value}|date_selector|properties={properties}|></code>
 * @element date_selector
 */
class date_selector extends propagate {

     /**
     * bound to a date
     * @type {datetime, default property}
     */
     date;

    /**
     * shows the time part of the date
     * @type {bool}
     */
     with_time = false;

}