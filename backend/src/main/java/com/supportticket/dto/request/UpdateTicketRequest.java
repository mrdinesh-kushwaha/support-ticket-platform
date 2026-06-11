package com.supportticket.dto.request;

import com.supportticket.enums.TicketCategory;
import com.supportticket.enums.TicketPriority;
import com.supportticket.enums.TicketStatus;
import lombok.Data;

@Data
public class UpdateTicketRequest {
    private TicketStatus status;
    private TicketPriority priority;
    private TicketCategory category;
    private Long assignedToId;
}
