import os
import sys
import argparse
from PIL import Image, ImageDraw, ImageFont

STYLE_CONFIGS = {
    'stadium_floodlights': {
        'brand_bg': (15, 23, 42, 230),
        'pill_bg': (15, 23, 42, 230),
        'pill_border': (245, 158, 11, 200), # Amber Gold
        'card_bg': (10, 14, 24, 235),
        'card_border': (245, 158, 11, 160),
        'prize_bg': (245, 158, 11, 255),   # Vibrant Amber
        'prize_text': (15, 23, 42),
        'title_color': (255, 255, 255),
        'title_shadow': (0, 0, 0, 220),
        'accent_line': (245, 158, 11, 140),
        'bar_color': (8, 11, 18)
    },
    'neon_cyberpunk': {
        'brand_bg': (15, 23, 42, 230),
        'pill_bg': (15, 23, 42, 230),
        'pill_border': (6, 182, 212, 200),  # Cyan
        'card_bg': (8, 12, 24, 235),
        'card_border': (6, 182, 212, 170),
        'prize_bg': (236, 72, 153, 255),   # Magenta Neon
        'prize_text': (255, 255, 255),
        'title_color': (255, 255, 255),
        'title_shadow': (0, 0, 0, 220),
        'accent_line': (6, 182, 212, 160),
        'bar_color': (6, 8, 18)
    },
    'gold_championship': {
        'brand_bg': (18, 16, 20, 230),
        'pill_bg': (18, 16, 20, 230),
        'pill_border': (234, 179, 8, 200),  # Metallic Gold
        'card_bg': (14, 12, 18, 238),
        'card_border': (234, 179, 8, 160),
        'prize_bg': (234, 179, 8, 255),    # Pure Gold
        'prize_text': (18, 14, 10),
        'title_color': (255, 255, 255),
        'title_shadow': (0, 0, 0, 220),
        'accent_line': (234, 179, 8, 150),
        'bar_color': (10, 8, 14)
    },
    'comic_action': {
        'brand_bg': (18, 18, 24, 230),
        'pill_bg': (18, 18, 24, 230),
        'pill_border': (239, 68, 68, 220),  # Red
        'card_bg': (15, 15, 22, 238),
        'card_border': (250, 204, 21, 200),
        'prize_bg': (250, 204, 21, 255),   # Comic Yellow
        'prize_text': (15, 23, 42),
        'title_color': (255, 255, 255),
        'title_shadow': (0, 0, 0, 220),
        'accent_line': (250, 204, 21, 160),
        'bar_color': (10, 10, 16)
    },
    'cosmic_arena': {
        'brand_bg': (15, 15, 32, 230),
        'pill_bg': (15, 15, 32, 230),
        'pill_border': (168, 85, 247, 200),# Purple
        'card_bg': (12, 10, 28, 238),
        'card_border': (168, 85, 247, 160),
        'prize_bg': (168, 85, 247, 255),   # Nebula Purple
        'prize_text': (255, 255, 255),
        'title_color': (255, 255, 255),
        'title_shadow': (0, 0, 0, 220),
        'accent_line': (168, 85, 247, 150),
        'bar_color': (8, 8, 20)
    }
}

def get_best_font(font_names, size):
    windows_fonts = r'C:\Windows\Fonts'
    for name in font_names:
        p = os.path.join(windows_fonts, name)
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_centered_text(draw, box, text, font, fill):
    """Draw text mathematically centered horizontally and vertically within box [x0, y0, x1, y1]"""
    tb = font.getbbox(text)
    tw = tb[2] - tb[0]
    th = tb[3] - tb[1]
    bw = box[2] - box[0]
    bh = box[3] - box[1]
    x = box[0] + (bw - tw) // 2 - tb[0]
    y = box[1] + (bh - th) // 2 - tb[1]
    draw.text((x, y), text, font=font, fill=fill)

def composite_sports_poster(
    input_path, 
    output_path, 
    title, 
    sport='Football', 
    prize_pool='₹50,000 Cash Prize', 
    venue='Nehru Stadium', 
    dates='Nov 20 - 25, 2026', 
    style='stadium_floodlights'
):
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    cfg = STYLE_CONFIGS.get(style, STYLE_CONFIGS['stadium_floodlights'])
    
    img = Image.open(input_path).convert('RGBA')
    target_w, target_h = 1080, 1350
    
    # Aspect-ratio preserving Center Crop & Cover
    # Prevents round soccer balls or trophies from getting stretched into egg shapes
    iw, ih = img.size
    scale = max(target_w / iw, target_h / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - target_w) // 2
    top = (nh - target_h) // 2
    img = img.crop((left, top, left + target_w, top + target_h))

    # 1. Gradient Overlay & Vignette Scrim
    overlay = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)

    # Top gradient scrim for brand readability
    for y in range(200):
        alpha = int(170 * (1 - y / 200))
        draw_overlay.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))

    # Atmospheric lower vignette for high contrast behind card
    for y in range(540, target_h):
        progress = (y - 540) / (target_h - 540)
        alpha = int(235 * (progress ** 1.3))
        draw_overlay.line([(0, y), (target_w, y)], fill=(cfg['bar_color'][0], cfg['bar_color'][1], cfg['bar_color'][2], alpha))

    # Fonts: Prioritize Bahnschrift (DIN athletic standard) and Segoe UI Black
    font_brand = get_best_font(['bahnschrift.ttf', 'segoeuib.ttf', 'arialbd.ttf'], 19)
    font_pill = get_best_font(['bahnschrift.ttf', 'segoeuib.ttf', 'arialbd.ttf'], 19)
    font_prize = get_best_font(['bahnschrift.ttf', 'segoeuib.ttf', 'arialbd.ttf'], 18)
    font_badge_sm = get_best_font(['bahnschrift.ttf', 'segoeuib.ttf', 'arialbd.ttf'], 14)
    font_tile_lbl = get_best_font(['bahnschrift.ttf', 'segoeuib.ttf', 'arialbd.ttf'], 14)
    font_tile_val = get_best_font(['bahnschrift.ttf', 'segoeuib.ttf', 'arialbd.ttf'], 18)
    font_sub_foot = get_best_font(['bahnschrift.ttf', 'segoeuib.ttf', 'arialbd.ttf'], 13)
    font_foot = get_best_font(['bahnschrift.ttf', 'segoeuib.ttf', 'arialbd.ttf'], 14)

    # Global Margins Grid
    margin_x = 52

    # 2. Top Header Badges (Symmetrical height and margins)
    # Left: ArenaX Brand Capsule
    brand_box = [margin_x, 50, margin_x + 225, 96]
    draw_overlay.rounded_rectangle(
        brand_box, 
        radius=12, 
        fill=cfg['brand_bg'], 
        outline=cfg['pill_border'], 
        width=1
    )
    draw_centered_text(draw_overlay, brand_box, 'ARENAX SPORTS', font_brand, (255, 255, 255))

    # Right: Sport Capsule
    sport_clean = (sport or 'SPORTS').upper().strip()
    sport_label = f'{sport_clean} CHAMPIONSHIP'
    sp_bb = font_pill.getbbox(sport_label)
    sp_w = (sp_bb[2] - sp_bb[0]) + 38
    pill_box = [target_w - margin_x - sp_w, 50, target_w - margin_x, 96]
    draw_overlay.rounded_rectangle(
        pill_box, 
        radius=12, 
        fill=cfg['pill_bg'], 
        outline=(255, 255, 255, 60), 
        width=1
    )
    draw_centered_text(draw_overlay, pill_box, sport_label, font_pill, (255, 255, 255))

    # 3. Typography Calculation for Tournament Title
    title_clean = (title or 'ARENAX CHAMPIONSHIP').upper().strip()
    inner_left = margin_x + 36
    inner_right = target_w - margin_x - 36
    inner_width = inner_right - inner_left

    if len(title_clean) > 34:
        title_size = 46
    elif len(title_clean) > 22:
        title_size = 52
    else:
        title_size = 58

    font_title = get_best_font(['bahnschrift.ttf', 'seguibl.ttf', 'ariblk.ttf', 'segoeuib.ttf', 'arialbd.ttf'], title_size)

    words = title_clean.split(' ')
    lines = []
    curr = ''
    for w in words:
        test = (curr + ' ' + w).strip()
        t_bb = font_title.getbbox(test)
        if (t_bb[2] - t_bb[0]) > inner_width and curr:
            lines.append(curr)
            curr = w
        else:
            curr = test
    if curr:
        lines.append(curr)
    lines = lines[:2] # Limit to 2 lines for clean structure

    # Dynamic Height Calculation for Balanced Card Vertical Padding
    # Elements inside card:
    # 1. Top row (Prize & Status pill): h=42px
    # 2. Gap: 18px
    # 3. Title lines: len(lines) * int(title_size * 1.15)
    # 4. Gap: 16px
    # 5. Accent divider: 1px
    # 6. Gap: 16px
    # 7. Inset Fixture Tiles (Venue & Dates): h=76px
    # 8. Gap: 14px
    # 9. Sanctioned status line: h=20px
    # 10. Symmetric top/bottom padding: 28px each
    line_h = int(title_size * 1.15)
    title_total_h = len(lines) * line_h
    content_inside_h = 42 + 18 + title_total_h + 16 + 1 + 16 + 76 + 14 + 20
    card_padding_y = 28
    card_h = content_inside_h + (card_padding_y * 2)

    # Place card elegantly docked above bottom brand bar (card_bottom_y = 1258)
    card_bottom_y = 1258
    card_top_y = card_bottom_y - card_h
    card_box = [margin_x, card_top_y, target_w - margin_x, card_bottom_y]

    draw_overlay.rounded_rectangle(
        card_box, 
        radius=22, 
        fill=cfg['card_bg'], 
        outline=cfg['card_border'], 
        width=2
    )

    composite = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(composite)

    # 4. Inside Card: Prize Pool Pill & Status Pill
    curr_y = card_top_y + card_padding_y
    prize_val = str(prize_pool or '').replace('🏆', '').strip()
    if not prize_val:
        prize_val = 'CASH PRIZE & TROPHY'
    prize_label = f'PRIZE POOL: {prize_val.upper()}'
    p_bb = font_prize.getbbox(prize_label)
    p_w = min((p_bb[2] - p_bb[0]) + 36, inner_width - 180)
    pz_box = [inner_left, curr_y, inner_left + p_w, curr_y + 42]
    draw.rounded_rectangle(pz_box, radius=9, fill=cfg['prize_bg'])
    draw_centered_text(draw, pz_box, prize_label, font_prize, cfg['prize_text'])

    # Official Status Pill (Top Right of Card)
    st_text = 'OFFICIAL FIXTURE'
    st_bb = font_badge_sm.getbbox(st_text)
    st_w = (st_bb[2] - st_bb[0]) + 26
    st_box = [inner_right - st_w, curr_y + 3, inner_right, curr_y + 39]
    draw.rounded_rectangle(st_box, radius=8, fill=(24, 32, 48, 200), outline=(148, 163, 184, 80), width=1)
    draw_centered_text(draw, st_box, st_text, font_badge_sm, (203, 213, 225))

    # 5. Tournament Title
    curr_y += 42 + 18
    for line in lines:
        draw.text((inner_left + 2, curr_y + 2), line, font=font_title, fill=cfg['title_shadow'])
        draw.text((inner_left, curr_y), line, font=font_title, fill=cfg['title_color'])
        curr_y += line_h

    # 6. Sleek Accent Divider Line
    curr_y += 16
    draw.line([(inner_left, curr_y), (inner_right, curr_y)], fill=cfg['accent_line'], width=1)
    curr_y += 1 + 16

    # 7. Two Inset Fixture Tiles: VENUE and DATES
    tile_h = 76
    gap = 18
    col_w = (inner_width - gap) // 2

    v_clean = str(venue or 'REGIONAL STADIUM').replace('📍', '').strip().upper()
    d_clean = str(dates or 'SEASON 2026').replace('📅', '').strip().upper()

    # Left Tile: Match Venue
    v_box = [inner_left, curr_y, inner_left + col_w, curr_y + tile_h]
    draw.rounded_rectangle(v_box, radius=12, fill=(18, 26, 40, 220), outline=(255, 255, 255, 30), width=1)
    draw.text((inner_left + 16, curr_y + 12), 'MATCH VENUE', font=font_tile_lbl, fill=cfg['prize_bg'])
    
    # Fit venue text gracefully with ellipsis
    max_val_w = col_w - 32
    if (font_tile_val.getbbox(v_clean)[2] - font_tile_val.getbbox(v_clean)[0]) > max_val_w:
        while len(v_clean) > 8 and (font_tile_val.getbbox(v_clean + '...')[2] - font_tile_val.getbbox(v_clean + '...')[0]) > max_val_w:
            v_clean = v_clean[:-1]
        v_clean = v_clean + '...'
    draw.text((inner_left + 16, curr_y + 36), v_clean, font=font_tile_val, fill=(240, 246, 255))

    # Right Tile: Tournament Dates
    d_box = [inner_left + col_w + gap, curr_y, inner_right, curr_y + tile_h]
    draw.rounded_rectangle(d_box, radius=12, fill=(18, 26, 40, 220), outline=(255, 255, 255, 30), width=1)
    draw.text((inner_left + col_w + gap + 16, curr_y + 12), 'TOURNAMENT DATES', font=font_tile_lbl, fill=cfg['prize_bg'])
    
    if (font_tile_val.getbbox(d_clean)[2] - font_tile_val.getbbox(d_clean)[0]) > max_val_w:
        while len(d_clean) > 8 and (font_tile_val.getbbox(d_clean + '...')[2] - font_tile_val.getbbox(d_clean + '...')[0]) > max_val_w:
            d_clean = d_clean[:-1]
        d_clean = d_clean + '...'
    draw.text((inner_left + col_w + gap + 16, curr_y + 36), d_clean, font=font_tile_val, fill=(240, 246, 255))

    # 8. Sanctioned Status Subtext inside Card
    curr_y += tile_h + 14
    foot_sub = 'SANCTIONED ARENAX EVENT  •  VERIFIED TOURNAMENT BRACKET  •  LIVE STATS'
    draw_centered_text(draw, [inner_left, curr_y, inner_right, curr_y + 20], foot_sub, font_sub_foot, (148, 163, 184))

    # 9. Bottom Official Brand Bar
    foot_box = [0, 1282, target_w, target_h]
    draw.rectangle(foot_box, fill=cfg['bar_color'])
    draw.line([(0, 1282), (target_w, 1282)], fill=(255, 255, 255, 25), width=1)
    foot_text = 'REGISTER SQUAD ON ARENAX  •  LIVE FIXTURES & BRACKETS  •  WWW.ARENAX.IN'
    draw_centered_text(draw, foot_box, foot_text, font_foot, (148, 163, 184))

    rgb_final = composite.convert('RGB')
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    rgb_final.save(output_path, quality=95)
    print(f"SUCCESS: Rendered official poster -> {output_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='ArenaX Sports Poster Compositor')
    parser.add_argument('--input', required=True, help='Path to raw artwork')
    parser.add_argument('--output', required=True, help='Path for output composite poster')
    parser.add_argument('--title', default='ArenaX Tournament Championship')
    parser.add_argument('--sport', default='Football')
    parser.add_argument('--prize', default='₹50,000 Cash Prize')
    parser.add_argument('--venue', default='Regional Stadium')
    parser.add_argument('--dates', default='Nov 20 - 25, 2026')
    parser.add_argument('--style', default='stadium_floodlights')

    args = parser.parse_args()
    composite_sports_poster(
        input_path=args.input,
        output_path=args.output,
        title=args.title,
        sport=args.sport,
        prize_pool=args.prize,
        venue=args.venue,
        dates=args.dates,
        style=args.style
    )
