import { TicketRegistration } from "@/types/ticket-registration.type";
import { getCacheTag } from "./cache-tags";
import { PaginatedResponse } from "@/types/paginated-response.type";
import { Ticket } from "@/types/ticket.type";
import { TicketSchemaType, UpdateTicketSchemaType } from "@/schemas/ticket.schema";
import { revalidateTag } from "next/cache";
import { TicketRegistrationForDay } from "@/types/ticket-registration-for-day.type";
import { TicketRegistrationForDaySchemaType } from "@/schemas/ticket-registration-for-day.schema";
import { getAuthHeaders } from "@/lib/auth";



const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const getTickets = async (authToken?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/tickets`, {
      headers: await getAuthHeaders(authToken),
      next: {
        tags: [getCacheTag('tickets', 'all')],
      },
    });
    const data = await response.json();

    if (response.ok) {
      return data as PaginatedResponse<Ticket>;
    } else {
      console.error(data);
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};


export const createTicket = async (ticket: TicketSchemaType, authToken?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
        headers: await getAuthHeaders(authToken),
      body: JSON.stringify(ticket),
    });
    const data = await response.json();

    if (response.ok) {
      revalidateTag(getCacheTag('tickets', 'all'));
      return data as Ticket;
    } else {
      console.error(data);
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateTicket = async (
  id: string,
  ticket: Partial<UpdateTicketSchemaType>,
  authToken?: string,
) => {
  try {
    const response = await fetch(`${BASE_URL}/tickets/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(authToken),
      body: JSON.stringify(ticket),
    });

    const data = await response.json();
    revalidateTag(getCacheTag('tickets', 'all'));
    if (!response.ok) {
      console.error(data);
      return {
        error: {
          code: data.code || 'UNKNOWN_ERROR',
          message: data.message || 'Error desconocido',
        },
      };
    }

    return data;
  } catch (error) {
    console.error('Error en updateUser:', error);
    throw error;
  }
};

export const deleteTicket = async (id: string, authToken?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/tickets/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(authToken),
    });

    const data = await response.json();

    if (response.ok) {
      revalidateTag(getCacheTag('tickets', 'all'));
      return data;
    } else {
      console.error(data);
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getTicketRegistrations = async (authToken?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/tickets/registrations`, {
      headers: await getAuthHeaders(authToken),
      next: {
        tags: [getCacheTag('tickets', 'all')],
      },
    });

    const data = await response.json();

    if (response.ok) {
      return data as TicketRegistration[];

    } else {
      console.error(data);
      return [];
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

  
  export const getTicketRegistrationById = async (id: string, authToken?: string) => {
    try {
      if (!id) return null;
  
      const response = await fetch(`${BASE_URL}/tickets/registrations/${id}`, {
        headers: await getAuthHeaders(authToken),
      });
      const data = await response.json();
  
      if (response.ok) {
        return data as TicketRegistration;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  export const createTicketRegistrationForDay = async (ticket: TicketRegistrationForDaySchemaType, authToken?: string) => {
    try {
      const response = await fetch(`${BASE_URL}/tickets/registrationForDays`, {
        method: 'POST',
        headers: await getAuthHeaders(authToken),
        body: JSON.stringify(ticket),
      });
      const data = await response.json();
  
      if (response.ok) {
        return data as TicketRegistrationForDay;
      } else {
        console.error(data);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

