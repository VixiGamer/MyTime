// Funzione per determinare il colore in base al voto

export const getRatingColor = (rating: number) => {
    if (rating === 0) return "#6c757d";
    if (rating === 10) return "#0dcaf0";
    if (rating < 3) return "#d63384"
    if (rating < 5) return "#dc3545";
    if (rating < 7) return "#ffc107";
    if (rating < 8) return "#1FA96D";
    if (rating < 10) return "#198754"
    return "##4D514F";
};


/* 
Altri colori:

$blue:    #0d6efd;
$indigo:  #6610f2;
$purple:  #6f42c1;
$pink:    #d63384;
$red:     #dc3545;
$orange:  #fd7e14;
$yellow:  #ffc107;
$green:   #198754;
$teal:    #20c997;
$cyan:    #0dcaf0;

*/