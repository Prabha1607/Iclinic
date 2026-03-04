from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse
from src.config.settings import settings
from src.control.voice_assistance.utils import fresh_state, make_gather, say
from src.control.voice_assistance.graph import build_call_graph, build_response_graph
from src.api.rest.dependencies import get_current_user
from src.control.voice_assistance.session_store import get_session, set_session, delete_session

router = APIRouter(prefix="/voice", tags=["Voice Assistance"])

call_graph     = build_call_graph()
response_graph = build_response_graph()


@router.post("/make-call")
async def make_call(
    request: Request,
    to_number: str = Query(...),
    current_user=Depends(get_current_user),
):
    result = await call_graph.ainvoke(fresh_state(to_number=to_number))

    if result.get("error"):
        return {"status": "error", "detail": result["error"]}

    call_sid = result["call_sid"]
    session_state = fresh_state(
        to_number=to_number,
        call_sid=call_sid,
        user_name=current_user.get("name"),
        user_email=current_user.get("email"),
        user_phone=current_user.get("phone_number"),
    )
    set_session(call_sid, session_state)

    return {"status": "call_placed", "call_sid": call_sid}


@router.post("/voice-response")
async def voice_response(request: Request):


    print("i came here [voice response] -----------------------------")
    form     = await request.form()
    call_sid = form.get("CallSid", "unknown")
    speech   = form.get("SpeechResult")


    state = get_session(call_sid) or fresh_state(
        to_number=form.get("To"),
        call_sid=call_sid,
    )

    state["user_text"] = speech.strip() if speech else None

    try:
        result = await response_graph.ainvoke(state)
    except Exception as exc:

        result = {**state, "ai_text": "I am sorry, something went wrong. Please try again."}

    graph_text = result.get("ai_text") or "Could you please repeat that?"

    
    ai_text = graph_text
    confirmation_done = result.get("confirmation_done", False)
    confirmed_user    = result.get("confirmed_user", False)
    emergency         = result.get("emergency", False)
    cancellation_complete = result.get("cancellation_complete", False)

    id = result.get("booked_slot_id")
    
    call_complete = (
        (confirmation_done and not confirmed_user)  # identity denied
        or id is not None                           # actual booking done
        or cancellation_complete                    # actual cancellation done
    )
    
    if call_complete:
        delete_session(call_sid)
    else:
        set_session(call_sid, result)

    # Build TwiML
    twiml = VoiceResponse()

    if emergency:
        say(twiml, ai_text)
        twiml.dial(settings.EMERGENCY_FORWARD_NUMBER) 

    if call_complete:
        say(twiml, ai_text)
        twiml.hangup()
    else:
        gather = make_gather()
        say(gather, ai_text)
        twiml.append(gather)
        
        retry = make_gather()
        say(retry, "Sorry, I did not catch that. Please go ahead and speak.")
        twiml.append(retry)
        say(twiml, "I still could not hear you. Thank you for calling. Goodbye.")
        twiml.hangup()

    return Response(content=str(twiml), media_type="application/xml")

