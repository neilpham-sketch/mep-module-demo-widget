/** CDC (Change Data Capture) topology this worker consumes from the shared mep.cdc exchange. */

/** Topic exchange mep-core's Debezium pipeline publishes to. */
export const CDC_EXCHANGE = 'mep.cdc';

/** Routing key for the user-core `User` table change stream. */
export const CDC_USER_ROUTING_KEY = 'mep.public.core_user';

/** This module's own queue bound to the user change stream — never shared with other modules. */
export const CDC_USER_QUEUE = 'mep.module-demo-widget.cdc.user';

/** Dead-letter exchange for failed CDC messages. */
export const CDC_DLX = 'mep.cdc.dlx';

/** Routing key this module's queue dead-letters to — keeps failures isolated per module. */
export const CDC_USER_DLQ_ROUTING_KEY = 'mep.module-demo-widget.cdc.user.dlq';
