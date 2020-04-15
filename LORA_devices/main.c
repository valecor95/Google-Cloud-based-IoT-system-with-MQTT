/*
 * Copyright (C) 2017 Inria
 *               2017 Inria Chile
 *
 * This file is subject to the terms and conditions of the GNU Lesser
 * General Public License v2.1. See the file LICENSE in the top level
 * directory for more details.
 */

/**
 * @ingroup     tests
 *
 * @file
 * @brief       Semtech LoRaMAC test application
 *
 * @author      Alexandre Abadie <alexandre.abadie@inria.fr>
 * @author      Jose Alamos <jose.alamos@inria.cl>
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>

#ifdef MODULE_SEMTECH_LORAMAC_RX
#include "thread.h"
#include "msg.h"
#include "xtimer.h"

#endif

#include "shell.h"
#include "semtech_loramac.h"

extern semtech_loramac_t loramac;

#ifdef MODULE_SEMTECH_LORAMAC_RX
#define LORAMAC_RECV_MSG_QUEUE                   (4U)
static msg_t _loramac_recv_queue[LORAMAC_RECV_MSG_QUEUE];
static char _recv_stack[THREAD_STACKSIZE_DEFAULT];

static void *_wait_recv(void *arg)
{
    msg_init_queue(_loramac_recv_queue, LORAMAC_RECV_MSG_QUEUE);

    (void)arg;
    while (1) {
        /* blocks until something is received */
        switch (semtech_loramac_recv(&loramac)) {
            case SEMTECH_LORAMAC_RX_DATA:
                loramac.rx_data.payload[loramac.rx_data.payload_len] = 0;
                printf("Data received: %s, port: %d\n",
                (char *)loramac.rx_data.payload, loramac.rx_data.port);
                break;

            case SEMTECH_LORAMAC_RX_LINK_CHECK:
                printf("Link check information:\n"
                   "  - Demodulation margin: %d\n"
                   "  - Number of gateways: %d\n",
                   loramac.link_chk.demod_margin,
                   loramac.link_chk.nb_gateways);
                break;

            case SEMTECH_LORAMAC_RX_CONFIRMED:
                puts("Received ACK from network");
                break;

            default:
                break;
        }
    }
    return NULL;
}
#endif

/*************			PERIODIC PUB			**************/
static void loramac_send(char* payload){
	uint8_t cnf = LORAMAC_DEFAULT_TX_MODE;  /* Default: confirmable */
	uint8_t port = LORAMAC_DEFAULT_TX_PORT; /* Default: 2 */

	semtech_loramac_set_tx_mode(&loramac, cnf);
	semtech_loramac_set_tx_port(&loramac, port);

	switch (semtech_loramac_send(&loramac,
								 (uint8_t *)payload, strlen(payload))) {
		case SEMTECH_LORAMAC_NOT_JOINED:
			puts("ERROR Cannot send: not joined");
			return;

		case SEMTECH_LORAMAC_DUTYCYCLE_RESTRICTED:
			puts("ERROR Cannot send: dutycycle restriction");
			return;

		case SEMTECH_LORAMAC_BUSY:
			puts("ERROR Cannot send: MAC is busy");
			return;

		case SEMTECH_LORAMAC_TX_ERROR:
			puts("ERROR Cannot send: error");
			return;

		case SEMTECH_LORAMAC_TX_CNF_FAILED:
			puts("ERROR Fail to send: no ACK received");
			return;
	}

	printf("SUCCESS: %s\n", payload);
}

static char* buildPayload(char* id){
    srand(time(NULL));
	int temperature = (rand() % (50 - (-50)) + 1) + (-50);
    int humidity = (rand() % (100 - 0 + 1)) + 0;
    int wind_direction = (rand() % (360 - 0 + 1)) + 0;
    int wind_intensity = (rand() % (100 - 0 + 1)) + 0;
    int rain_height = (rand() % (50 - 0 + 1)) + 0;

    char* payload = malloc(sizeof(char)*300);
	sprintf(payload, "{\"deviceId\": \"%s\",\"temperature\": %d,\"humidity\": %d,\"wind_direction\": %d,\"wind_intensity\": %d,\"rain_height\": %d}", 
                        id, temperature, humidity, wind_direction, wind_intensity, rain_height);

    return payload;
}

// Publish random values periodically (5 sec)
static int ttn_pub(int argc, char **argv)
{
	if(argc < 2){
		printf("usage: %s <id>\n", argv[0]);
        return 1;
	}
    char* id = argv[1];
    
    /* publish random data periodically */
    while(1){
		char* payload = buildPayload(id);
		
        loramac_send(payload);
        xtimer_sleep(8);
	}

    return 0;
}
/******************************************************************/

/* loramac shell command handler is implemented in
   sys/shell/commands/sc_loramac.c */

static const shell_command_t shell_commands[] = {
	{ "ttn_pub", "publish data periodically on ttn", ttn_pub },
    { NULL, NULL, NULL }
};

int main(void)
{
#ifdef MODULE_SEMTECH_LORAMAC_RX
    thread_create(_recv_stack, sizeof(_recv_stack),
                  THREAD_PRIORITY_MAIN - 1, 0, _wait_recv, NULL, "recv thread");
#endif

    puts("All up, running the shell now");
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);
}
